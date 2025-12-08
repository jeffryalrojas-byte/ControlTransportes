import { Component, OnInit } from '@angular/core';
import { ConfiguracionService } from '../services/configuracion.service';
import { SesionService } from '../services/sesion.service';
import { IncapacidadesService } from '../services/incapacidades.service';
import { PlanillasService } from '../services/planillas.service';
import { v4 as uuid } from 'uuid';
import { RrhhService } from '../services/rrhh.service';

interface Empleado {
  id: number;
  nombre: string;
  puesto: string;
  tipoPago: 'mensual' | 'diario';
  salarioBase: number;
  dias?: number;
  tipoContrato?: 'indefinido' | 'definido';
  fechaFinContrato?: string | Date | null;
  fechaFinContratoDate?: Date | null;
  extras?: number;   // 
}

interface Planilla {
  id?: string;
  mes: string;
  fechaCreacion: string;
  totalNeto: number;
  totalCargas: number;
  detalleEmpleados: { id: string | number; salarioNeto: number }[];
  empresaCedula: string;
}

@Component({
  selector: 'app-planilla',
  templateUrl: './planilla.component.html',
  styleUrls: ['./planilla.component.scss']
})
export class PlanillaComponent implements OnInit {

  empleados: Empleado[] = [];
  empleadosOriginal: Empleado[] = [];

  diasTrabajados: { [id: number]: number } = {};

  //Para cargar las planillas
  planillas: Planilla[] = [];
  planillasDelAnio: any[] = [];
  planillasAnteriores: any[] = [];

  //Para cargar las incapacidades
  incapacidades: any[] = [];

  ccssTrabajador = 0.0967;
  ccssPatrono = 0.1467;

  mesActual = '';
  totalNeto = 0;
  totalCargas = 0;

  empresaCedulaActual: string | null = null;

  //Para ordenar la planilla
  anioActual: number = new Date().getFullYear();
  mostrarAnteriores: boolean = false;

  constructor(
    private configuracionService: ConfiguracionService,
    private sesionService: SesionService,
    private incapacidadesService: IncapacidadesService,
    private planillasService: PlanillasService,
    private rrhhService: RrhhService
  ) { }

  ngOnInit() {
    this.empresaCedulaActual = this.sesionService.getCedulaEmpresaActual();
    if (!this.empresaCedulaActual) {
      alert('⚠️ No se encontró una empresa activa. Inicia sesión nuevamente.');
      return;
    }

    // Cargar cargas de CCSS desde Firebase
    this.configuracionService.obtenerCargas().subscribe(cargas => {
      if (cargas) {
        this.ccssTrabajador = cargas.ccssTrabajador;
        this.ccssPatrono = cargas.ccssPatrono;
      } else {
        // Valores por defecto si no hay configuración guardada aún
        this.ccssTrabajador = 0.1067;
        this.ccssPatrono = 0.2667;
      }
    });


    // Cargar empleados desde Firebase
    this.rrhhService.obtener().subscribe(empList => {
      const lista = empList.map(e => ({
        id: e.id,
        nombre: e.nombre,
        puesto: e.puesto,
        tipoPago: e.tipoPago,
        salarioBase: e.tipoPago === 'mensual'
          ? e.salarioMensual
          : e.salarioDiario,
        dias: 0,
        tipoContrato: e.tipoContrato,
        fechaFinContrato: e.fechaFinContrato || '',
        fechaFinContratoDate: e.fechaFinContrato ? new Date(e.fechaFinContrato) : null,
        extras: 0
      }));
      this.empleadosOriginal = [...lista];
      this.empleados = [...lista];

    });


    // Cargar incapacidades
    this.incapacidadesService.obtener().subscribe(data => {
      this.incapacidades = data;
    });

    // Cargar planillas desde Firebase
    this.planillasService.obtener().subscribe((data: any[]) => {
      // ordenar desc
      const ordenadas = data.sort((a, b) => b.mes.localeCompare(a.mes));

      this.planillas = ordenadas;

      // solo del año actual
      this.planillasDelAnio = ordenadas.filter(p => p.mes.startsWith(this.anioActual.toString()));

      // planillas anteriores
      this.planillasAnteriores = ordenadas.filter(p => !p.mes.startsWith(this.anioActual.toString()));
    });


    // Sincronizar días
    this.empleados.forEach(e => {
      this.diasTrabajados[e.id] = e.dias || 0;
    });

    this.calcularTotales();
  }

  // ===============================
  //   CÁLCULOS
  // ===============================

  salarioBruto(e: Empleado): number {

    // ============================================
    // 1) MONTO POR DÍA
    // ============================================
    const montoPorDia =
      e.tipoPago === 'mensual'
        ? e.salarioBase / 30
        : e.salarioBase;

    let diasTrabOriginal =
      e.tipoPago === 'mensual'
        ? 30
        : (this.diasTrabajados[e.id] || 0);

    // ============================================
    // 2) AJUSTE POR CONTRATO DEFINIDO
    // ============================================
    if (e.tipoContrato === 'definido' && e.fechaFinContratoDate && this.mesActual) {
      const [anio, mes] = this.mesActual.split("-");
      const finMes = new Date(Number(anio), Number(mes), 0);

      if (e.fechaFinContratoDate < finMes) {
        const diaFinContrato = e.fechaFinContratoDate.getDate();
        const maxDias = Math.min(diaFinContrato, diasTrabOriginal);

        diasTrabOriginal =
          e.tipoPago === 'mensual'
            ? maxDias
            : Math.min(this.diasTrabajados[e.id] || 0, maxDias);
      }
    }

    if (!this.mesActual) {
      return diasTrabOriginal * montoPorDia;
    }

    const mesKey = this.mesActual.slice(0, 7);
    const [anio, mes] = mesKey.split("-");
    const inicioMes = new Date(Number(anio), Number(mes) - 1, 1);
    const finMes = new Date(Number(anio), Number(mes), 0);

    // ============================================
    // 3) TOMAR TODAS LAS INCAPACIDADES DEL EMPLEADO
    //    (NO SOLO LAS DEL MES)
    // ============================================
    const todas = this.incapacidades
      .filter(i => i.empleadoId === e.id)
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

    // ============================================
    // 4) FORMAR BLOQUES CONTINUOS
    // ============================================
    let bloques: { inicio: Date, fin: Date, dias: number, tipo: string }[] = [];

    let temp: any = null;

    for (const inc of todas) {
      const ini = new Date(inc.fechaInicio);
      const fi = new Date(inc.fechaFin);

      if (!temp) {
        temp = { inicio: ini, fin: fi, tipo: inc.tipo };
        continue;
      }

      const diaSiguiente = new Date(temp.fin);
      diaSiguiente.setDate(diaSiguiente.getDate() + 1);

      // Continua SOLO si es el mismo tipo y día seguido
      if (ini.getTime() === diaSiguiente.getTime() && inc.tipo === temp.tipo) {
        temp.fin = fi;
      } else {
        const dias = Math.floor((temp.fin.getTime() - temp.inicio.getTime()) / 86400000) + 1;
        bloques.push({ ...temp, dias });

        temp = { inicio: ini, fin: fi, tipo: inc.tipo };
      }
    }

    if (temp) {
      const dias = Math.floor((temp.fin.getTime() - temp.inicio.getTime()) / 86400000) + 1;
      bloques.push({ ...temp, dias });
    }

    // ============================================
    // 5) CALCULAR EFECTO DE CADA BLOQUE EN ESTE MES
    // ============================================
    let totalDiasIncap = 0;
    let totalDias50 = 0;

    for (const b of bloques) {

      // NO afecta este mes → ignorar
      if (b.fin < inicioMes || b.inicio > finMes) continue;

      // dias del bloque que caen en ESTE mes
      const inicioCalc = b.inicio < inicioMes ? inicioMes : b.inicio;
      const finCalc = b.fin > finMes ? finMes : b.fin;

      const diasEnEsteMes =
        Math.floor((finCalc.getTime() - inicioCalc.getTime()) / 86400000) + 1;

      // ---------------------
      // tipo: ENFERMEDAD
      // ---------------------
      if (b.tipo === "enfermedad") {

        // cuantos días del bloque vienen ANTES del mes?
        let diasPrevios =
          b.inicio < inicioMes
            ? Math.floor((inicioMes.getTime() - b.inicio.getTime()) / 86400000)
            : 0;

        // ya se consumieron 3 días en meses previos?
        const restantes50 = Math.max(3 - diasPrevios, 0);

        // en este mes aplican al 50% solo los que falten
        const d50_mes = Math.min(restantes50, diasEnEsteMes);

        totalDias50 += d50_mes;
        totalDiasIncap += diasEnEsteMes;
      }

      // ---------------------
      // ACCIDENTE, MATERNIDAD, PERMISOSG
      // ---------------------
      else if (b.tipo === "accidente" || b.tipo === "maternidad" || b.tipo === "permisosg") {
        totalDiasIncap += diasEnEsteMes;
      }

      // ---------------------
      // PATERNIDAD → NO REBAJA DÍAS
      // ---------------------
      else if (b.tipo === "paternidad") {
        // NO suma a incapacidad
      }
    }

    // ============================================
    // 6) SALARIO FINAL
    // ============================================
    const diasTrabEfectivos = Math.max(diasTrabOriginal - totalDiasIncap, 0);

    const salarioTrabajado = diasTrabEfectivos * montoPorDia;
    const salario50 = totalDias50 * montoPorDia * 0.5;

    return salarioTrabajado + salario50 + (e.extras || 0);
  }





  rebajosTrabajador(e: Empleado): number {
    if (e.tipoPago === 'diario') return 0;
    return this.salarioBruto(e) * this.ccssTrabajador;
  }

  salarioNeto(e: Empleado): number {
    const bruto = this.salarioBruto(e);
    if (e.tipoPago === 'diario') return bruto;
    return bruto - this.rebajosTrabajador(e);
  }

  cargaPatronal(e: Empleado): number {
    if (e.tipoPago === 'diario') return 0;
    return this.salarioBruto(e) * this.ccssPatrono;
  }

  actualizarDias(id: number, event: any) {
    const valor = Number(event.target.value) || 0;
    this.diasTrabajados[id] = valor;

    const emp = this.empleados.find(e => e.id === id);
    if (emp) emp.dias = valor;

    this.calcularTotales();
  }

  calcularTotales() {
    this.totalNeto = this.empleados.reduce((sum, e) => sum + this.salarioNeto(e), 0);
    this.totalCargas = this.empleados.reduce((sum, e) => sum + this.cargaPatronal(e), 0);
  }

  // ===============================
  //   GUARDAR EN FIREBASE
  // ===============================

  guardarPlanilla() {
    if (!this.mesActual) {
      alert('Selecciona un mes antes de guardar.');
      return;
    }

    if (!this.empresaCedulaActual) {
      alert('No hay empresa activa.');
      return;
    }

    // 🔥 VALIDAR SI YA EXISTE PLANILLA DEL MES
    this.planillasService.existePlanillaMes(this.mesActual).subscribe(snap => {

      const planillas = snap.docs.map(d => d.data());

      if (planillas.length > 0) {
        alert(`🚫 No se puede guardar la planilla.\nLa planilla del mes ${this.mesActual} ya fue presentada.\n\n➡️ Si desea modificar información, primero debe eliminarla.`);
        return;
      }

      this.calcularTotales();

      const nuevaPlanilla: Planilla = {
        id: uuid(),
        mes: this.mesActual,
        fechaCreacion: new Date().toLocaleString(),
        totalNeto: this.totalNeto,
        totalCargas: this.totalCargas,
        detalleEmpleados: this.empleados.map(e => ({
          id: e.id,
          salarioNeto: this.salarioNeto(e)
        })),
        empresaCedula: this.empresaCedulaActual!
      };

      this.planillasService.agregar(nuevaPlanilla)
        .then(() => {
          alert(`✅ Planilla del mes ${this.mesActual} guardada correctamente.`);
          this.mesActual = '';
        })
        .catch(err => {
          console.error(err);
          alert('❌ Error al guardar la planilla.');
        });
    }); // end subscribe
  }

  // ===============================
  //   ELIMINAR DE FIREBASE
  // ===============================

  eliminarPlanilla(planilla: any) {
    const confirmar = confirm(`¿Eliminar la planilla de ${planilla.mes}?`);

    if (!confirmar) return;

    this.planillasService.eliminar(planilla.id)
      .then(() => {
        alert('🗑️ Planilla eliminada correctamente.');
      })
      .catch(err => {
        console.error(err);
        alert('❌ Error eliminando la planilla.');
      });
  }

  //Valida si puedo eliminar la planilla para que aparezca el botón
  puedeEliminar(planilla: any): boolean {
    const fechaCreacion = new Date(planilla.fechaCreacion);
    const hoy = new Date();

    // Obtener fecha límite (hoy - 2 meses)
    const haceDosMeses = new Date();
    haceDosMeses.setMonth(haceDosMeses.getMonth() - 2);

    // Si la fecha de creación es más antigua que hace 2 meses → NO se puede eliminar
    return fechaCreacion >= haceDosMeses;
  }


  onMesChange() {
    this.incapacidadesService.obtener().subscribe(data => {
      this.incapacidades = data;

      if (this.mesActual) {
        const [anio, mes] = this.mesActual.split("-");
        const inicioMes = new Date(Number(anio), Number(mes) - 1, 1);

        // 🔥 USAR SIEMPRE LA LISTA ORIGINAL
        this.empleados = this.empleadosOriginal.filter(e => {
          if (e.tipoContrato === 'indefinido') return true;
          if (!e.fechaFinContratoDate) return true;
          return e.fechaFinContratoDate >= inicioMes;
        });

      } else {
        // si borra el mes → restaurar todos
        this.empleados = [...this.empleadosOriginal];
      }

      this.calcularTotales();
    });
  }





}
