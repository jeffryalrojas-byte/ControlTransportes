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
  fechaIngreso?: string | Date;
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
  detalleEmpleados: {
    id: string | number;
    diasTrabajados: number;
    diasIncapacidad: number;
    diasIncapacidad50: number;
    salarioBruto: number;
    salarioNeto: number
  }[];
  empresaCedula: string;
}

@Component({
  selector: 'app-planilla',
  templateUrl: './planilla.component.html',
  styleUrls: ['./planilla.component.scss']
})
export class PlanillaComponent implements OnInit {

  usuarioActivo: any;

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

  //Para visualizar el detalle de la planilla
  detalleVisible = false;
  planillaSeleccionada: any = null;
  detallesMostrar: any[] = [];

  //Para obtener los incentivos del puesto 
  incentivos: { [puesto: string]: number } = {};


  constructor(
    private configuracionService: ConfiguracionService,
    private sesionService: SesionService,
    private incapacidadesService: IncapacidadesService,
    private planillasService: PlanillasService,
    private rrhhService: RrhhService
  ) { }

  ngOnInit() {
    // Obtenemos el usuario desde el servicio
    this.usuarioActivo = this.sesionService.getUsuarioActivo();

    this.empresaCedulaActual = this.sesionService.getCedulaEmpresaActual();
    if (!this.empresaCedulaActual) {
      alert('⚠️ No se encontró una empresa activa. Inicia sesión nuevamente.');
      return;
    }

    //Cargamos las configuración de las cargas sociales
    this.CargasSociales();

    //Cargamos los empleados
    this.CargamosEmpleados();

    //Cargamos incapacidades
    this.CargamosIncapacidades();

    //Cargamos Planillas
    this.CargamosPlanillas();

    //Cargamos Incentivos
    this.CargamosIncentivos();

    this.calcularTotales();
  }


  public CargasSociales(): any {
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
  }

  public CargamosEmpleados(): any {

    this.empleados.forEach(e => {
      if (e.tipoPago === 'diario') {
        this.diasTrabajados[e.id] = 0;
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
        fechaIngreso: e.fechaIngreso,
        fechaFinContrato: e.fechaFinContrato || '',
        fechaFinContratoDate: e.fechaFinContrato ? new Date(e.fechaFinContrato) : null,
        extras: 0
      }));
      this.empleadosOriginal = [...lista];
      this.empleados = [...lista];

    });
  }

  public CargamosIncapacidades(): any {
    // Cargar incapacidades
    this.incapacidadesService.obtener().subscribe(data => {
      this.incapacidades = data;
    });

  }

  public CargamosPlanillas(): any {
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
  }

  public CargamosIncentivos(): any {
    this.configuracionService.obtenerIncentivos().subscribe(data => {
      this.incentivos = data || {};
    });
  }


  // ===============================
  //   CÁLCULOS
  // ===============================

  /** Método que nos permite obtener el salario Neto y Bruto del empleado
   * ya quenos permite tomar en cuenta permisos, incapacidad o vacaciones si es el caso
   * NO SUMA Aquí los incentivos, ya que los mismos no se rebajan
  */
  public salarioBrutoBase(e: Empleado): number {

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

    // ============================================
    // 3) SIN MES → salario directo
    // ============================================
    if (!this.mesActual) {
      return diasTrabOriginal * montoPorDia;
    }

    // ============================================
    // 4) INCAPACIDADES (DELEGADO AL SERVICE)
    // ============================================
    const { diasIncap, dias50 } =
      this.incapacidadesService.calcularIncapacidadesMes(
        this.incapacidades, // TODAS las incapacidades cargadas
        e.id,
        this.mesActual
      );

    // ============================================
    // 5) SALARIO FINAL
    // ============================================
    const diasTrabEfectivos = Math.max(diasTrabOriginal - diasIncap, 0);

    const salarioTrabajado = diasTrabEfectivos * montoPorDia;
    const salario50 = dias50 * montoPorDia * 0.5;

    return salarioTrabajado + salario50 + (e.extras || 0);
  }

  /** Método encargardo de guardar el salario bruto más el incentivo si el puesto lo amerita
  */
  salarioBruto(e: Empleado): number {
    return this.salarioBrutoBase(e) + this.incentivoPorPuesto(e);
  }


  rebajosTrabajador(e: Empleado): number {
    if (e.tipoPago === 'diario') return 0;
    return this.salarioBrutoBase(e) * this.ccssTrabajador;
  }

  salarioNeto(e: Empleado): number {
    const base = this.salarioBrutoBase(e);
    const incentivo = this.incentivoPorPuesto(e);

    if (e.tipoPago === 'diario') {
      return base + incentivo;
    }
    return base - this.rebajosTrabajador(e) + incentivo;
  }

  cargaPatronal(e: Empleado): number {
    if (e.tipoPago === 'diario') return 0;
    return this.salarioBrutoBase(e) * this.ccssPatrono;
  }

  actualizarDias(id: number, event: any) {
    const valor = Number(event.target.value) || 0;
    this.diasTrabajados[id] = valor;

    /*     const emp = this.empleados.find(e => e.id === id);
        if (emp) emp.dias = valor;
     */
    this.calcularTotales();
  }

  calcularTotales() {
    this.totalNeto = this.empleados.reduce((sum, e) => sum + this.salarioNeto(e), 0);
    this.totalCargas = this.empleados.reduce((sum, e) => sum + this.cargaPatronal(e), 0);
  }

  private incentivoPorPuesto(e: Empleado): number {
    return this.incentivos[e.puesto] || 0;
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
        detalleEmpleados: this.empleados.map(e => {

          const { diasIncap, dias50 } =
            this.incapacidadesService.calcularIncapacidadesMes(
              this.incapacidades,
              e.id,
              this.mesActual
            );

          return {
            id: e.id,
            diasTrabajados: e.tipoPago === 'diario'
              ? (this.diasTrabajados[e.id] || 0)
              : 0,
            diasIncapacidad: diasIncap,
            diasIncapacidad50: dias50,
            salarioBruto: this.salarioBruto(e),
            salarioNeto: this.salarioNeto(e)
          };
        }),
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

    if (this.usuarioActivo?.rol === 'Supervisor') {
      return false;
    }

    const fechaCreacion = this.parseFechaYHora(planilla.fechaCreacion);

    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);

    // Retorna true si se puede eliminar
    return fechaCreacion <= haceUnMes;
  }


  //Cada vez que selecciona el mes a presentar la planilla hace validaciones.
  onMesChange() {

    alert('Recuerde antes de presentar la planilla, ingresar cualquier incapacidad o permiso que tenga el empleado para el mes seleccionado.');

    this.incapacidadesService.obtener().subscribe(data => {
      this.incapacidades = data;

      if (this.mesActual) {
        const [anio, mes] = this.mesActual.split("-");
        const inicioMes = new Date(Number(anio), Number(mes) - 1, 1);
        const finMes = new Date(Number(anio), Number(mes), 0);

        // 🔥 USAR SIEMPRE LA LISTA ORIGINAL
        this.empleados = this.empleadosOriginal.filter(e => {
          // 1️⃣ Fecha de ingreso
          if (e.fechaIngreso) {
            const ingreso = new Date(e.fechaIngreso);
            if (ingreso > finMes) return false;
          }
          // 2️⃣ Contrato indefinido
          if (e.tipoContrato === 'indefinido') return true;
          // 3️⃣ Contrato definido
          if (e.fechaFinContratoDate) {
            return e.fechaFinContratoDate >= inicioMes;
          }
          // 4️⃣ Si no hay fecha fin, se asume activo
          return true;
        });

      } else {
        // si borra el mes → restaurar todos
        this.empleados = [...this.empleadosOriginal];
      }

      this.calcularTotales();
    });
  }

  private parseFechaYHora(fechaStr: string): Date {
    // Separa fecha y hora
    const [fecha, hora] = fechaStr.split(', ');

    const [dia, mes, anio] = fecha.split('/').map(Number);
    const [hh, mm, ss] = hora.split(':').map(Number);

    return new Date(anio, mes - 1, dia, hh, mm, ss);
  }

  //Ver detalles de los salarios de la planilla del mes seleccionado
  verDetalles(planilla: any) {
    this.planillaSeleccionada = planilla;

    this.detallesMostrar = planilla.detalleEmpleados.map((de: any) => {

      const emp = this.empleadosOriginal.find(e => e.id == de.id);

      return {
        nombre: emp ? emp.nombre : 'Empleado no encontrado',
        salarioBruto: de.salarioBruto ?? de.salarioNeto,
        salarioNeto: de.salarioNeto,
        diasTrabajados: de.diasTrabajados,
        diasIncapacidad: de.diasIncapacidad ?? 0,
        diasIncapacidad50: de.diasIncapacidad50 ?? 0
      };
    });

    this.detalleVisible = true;
  }


}
