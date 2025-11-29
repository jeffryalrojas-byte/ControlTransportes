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
  planillas: Planilla[] = [];
  incapacidades: any[] = [];

  ccssTrabajador = 0.0967;
  ccssPatrono = 0.1467;

  mesActual = '';
  totalNeto = 0;
  totalCargas = 0;

  empresaCedulaActual: string | null = null;

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
      this.planillas = data.sort((a: any, b: any) => {
        return a.mes.localeCompare(b.mes); // ordena YYYY-MM correctamente
      });
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

    const montoPorDia = e.tipoPago === 'mensual'
      ? e.salarioBase / 30
      : e.salarioBase;

    let diasTrabOriginal = e.tipoPago === 'mensual'
      ? 30
      : (this.diasTrabajados[e.id] || 0);

    if (!this.mesActual) {
      return diasTrabOriginal * montoPorDia;
    }

    const mesKey = this.mesActual.slice(0, 7);

    // Incapacidades del mes
    const incs = this.incapacidades
      .filter(i => i.empleadoId === e.id && i.mes?.slice(0, 7) === mesKey)
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

    // =========================================
    // 1) DIVIDIR INCAPACIDADES EN BLOQUES
    //    SOLO SI SON REALMENTE CONTINUAS
    // =========================================
    let bloques: number[] = [];

    if (incs.length > 0) {
      let inicio = new Date(incs[0].fechaInicio);
      let fin = new Date(incs[0].fechaFin);

      for (let i = 1; i < incs.length; i++) {
        const inicioActual = new Date(incs[i].fechaInicio);

        const diaSiguiente = new Date(fin);
        diaSiguiente.setDate(diaSiguiente.getDate() + 1);

        // Si NO es continua → cerrar bloque
        if (inicioActual.getTime() !== diaSiguiente.getTime()) {
          const diasBloque = Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1;
          bloques.push(diasBloque);

          inicio = inicioActual;
        }

        // Actualizar fin siempre
        fin = new Date(incs[i].fechaFin);
      }

      // último bloque
      const diasUltimo = Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1;
      bloques.push(diasUltimo);
    }

    // =========================================
    // 2) CALCULAR DÍAS AL 50% POR CADA BLOQUE
    // =========================================

    let totalDias50 = 0;
    let totalDiasIncap = 0;

    for (const dias of bloques) {
      totalDias50 += Math.min(3, dias);
      totalDiasIncap += dias;
    }

    // =========================================
    // 3) SALARIO
    // =========================================

    const diasTrabEfectivos = Math.max(diasTrabOriginal - totalDiasIncap, 0);

    const salarioTrabajado = diasTrabEfectivos * montoPorDia;
    const salario50 = totalDias50 * montoPorDia * 0.5;

    const extras = e.extras || 0;

    return salarioTrabajado + salario50 + extras;
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
