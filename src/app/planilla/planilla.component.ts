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

    // Cargar cargas de CCSS
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
      this.empleados = empList.map(e => ({
        id: e.id, // O dejalo como string si tu modelo lo permite
        nombre: e.nombre,
        puesto: e.puesto,
        tipoPago: e.tipoPago,
        salarioBase: e.tipoPago === 'mensual'
          ? e.salarioMensual
          : e.salarioDiario,
        dias: 0
      }));
    });


    // Cargar incapacidades
    this.incapacidades = this.incapacidadesService.obtener();

    // Cargar planillas desde Firebase
    this.planillasService.obtener().subscribe((data: any[]) => {
      this.planillas = data;
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
    const montoPorDia = e.tipoPago === 'mensual' ? e.salarioBase / 30 : e.salarioBase;
    const diasTrab = e.tipoPago === 'mensual' ? 30 : (this.diasTrabajados[e.id] || 0);
    let bruto = diasTrab * montoPorDia;

    if (!this.mesActual) return bruto;

    const incapacidadesMes = this.incapacidades.filter(i => {
      if (i.empleadoId !== e.id) return false;
      return i.mes?.slice(0, 7) === this.mesActual.slice(0, 7);
    });

    let rebajo = 0;

    incapacidadesMes.forEach(i => {
      const dias = i.dias;
      const tipo = i.tipo.toLowerCase();

      if (['maternidad', 'accidente', 'permisosg'].includes(tipo)) {
        rebajo += dias * montoPorDia;
      } else if (tipo === 'enfermedad') {
        const diasPagados50 = Math.min(dias, 3);
        const totalPagadoIncapacidad = diasPagados50 * (montoPorDia * 0.5);
        const totalNormal = dias * montoPorDia;
        rebajo += totalNormal - totalPagadoIncapacidad;
      }
    });

    return Math.max(bruto - rebajo, 0);
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
      empresaCedula: this.empresaCedulaActual
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
    this.incapacidades = this.incapacidadesService.obtener();
    this.calcularTotales();
  }
}
