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
    const montoPorDia = e.tipoPago === 'mensual' ? e.salarioBase / 30 : e.salarioBase;
    const diasTrabOriginal = e.tipoPago === 'mensual' ? 30 : (this.diasTrabajados[e.id] || 0);

    if (!this.mesActual) {
      return diasTrabOriginal * montoPorDia;
    }

    // incapacidades del mes (las partes que pertenecen al mes actual)
    const incapacidadesMes = this.incapacidades.filter(i =>
      i.empleadoId === e.id &&
      i.mes?.slice(0, 7) === this.mesActual.slice(0, 7)
    );

    // 1) total días de incapacidad en este mes (suma simple)
    const totalDiasIncapEnMes = incapacidadesMes.reduce((s, x) => s + (x.dias || 0), 0);

    // 2) calcular cuántos días al 50% *corresponden al mes actual* (respetando 3 días por numIncapacidad)
    let totalDias50EnMes = 0;

    // agrupar todas las partes por numIncapacidad (solo para este empleado)
    const grupos = new Map<string, any[]>();
    this.incapacidades
      .filter(x => x.empleadoId === e.id && x.numIncapacidad) // todas las partes del empleado
      .forEach(x => {
        const key = x.numIncapacidad!;
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key)!.push(x);
      });

    const mesKey = this.mesActual.slice(0, 7);

    grupos.forEach(partes => {
      // ordenar partes por fechaInicio ascendente
      partes.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

      // contar días ya usados en meses ANTERIORES
      let diasUsadosPrevios = 0;
      for (const p of partes) {
        const pMes = p.mes?.slice(0, 7);
        if (!pMes) continue;
        if (pMes === mesKey) break;
        diasUsadosPrevios += p.dias;
      }

      // cuántos días de los 3 ya están "consumidos"
      let restante50 = Math.max(3 - diasUsadosPrevios, 0);

      // ahora asignar los días 50% que correspondan a las partes del MES actual
      for (const p of partes) {
        const pMes = p.mes?.slice(0, 7);
        if (pMes !== mesKey) continue; // sólo nos interesan las partes del mes actual
        if (restante50 <= 0) break;

        const diasEnEstaParte = p.dias;
        const dias50ParaEstaParte = Math.min(restante50, diasEnEstaParte);
        totalDias50EnMes += dias50ParaEstaParte;
        restante50 -= dias50ParaEstaParte;
      }
    });

    // 3) ahora calcular el salario bruto efectivo:
    //    dias efectivamente trabajados este mes = diasTrabOriginal - totalDiasIncapEnMes
    const diasTrabEfectivos = Math.max(diasTrabOriginal - totalDiasIncapEnMes, 0);

    // bruto = (días trabajados efectivos * montoPorDia) + (días al 50% * montoPorDia * 0.5)
    const bruto = (diasTrabEfectivos * montoPorDia) + (totalDias50EnMes * montoPorDia * 0.5);

    return Math.max(bruto, 0);
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
    this.incapacidadesService.obtener().subscribe(data => {
      this.incapacidades = data;
      this.calcularTotales();
    });

  }
}
