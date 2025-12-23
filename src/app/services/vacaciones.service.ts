import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { v4 as uuid } from 'uuid';
import { map } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { SesionService } from './sesion.service';
import { IncapacidadesService } from './incapacidades.service';

export interface SolicitudVacaciones {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  observacion: string;
  periodo?: string;
  empresaId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {

  constructor(private afs: AngularFirestore,
    private sesionService: SesionService,
    private incapacidadesService: IncapacidadesService
  ) { }

  /** Método que nos permite obtener la empresa Actual*/
  private obtenerEmpresaCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  /** Método que nos calcula el periodo de vacaciones, por ejemplo "2023-2024"*/
  public calcularPeriodo(fechaIngreso: Date, fechaSolicitud: Date): string {
    let inicio = new Date(fechaIngreso);
    let fin = new Date(inicio);
    fin.setFullYear(fin.getFullYear() + 1);

    while (fechaSolicitud >= fin) {
      inicio = new Date(fin);
      fin.setFullYear(fin.getFullYear() + 1);
    }

    return `${inicio.getFullYear()}-${fin.getFullYear()}`;
  }

  /** Método que nos permite registrar las vacaciones*/
  public registrarSolicitud(solicitud: SolicitudVacaciones, empleado: any) {
    const empresaId = this.obtenerEmpresaCedula();
    const ingreso = new Date(empleado.fechaIngreso);
    const fechaSolicitud = new Date(solicitud.fechaInicio);

    // ✔ Solo calcular el período si NO viene desde el componente
    if (!solicitud.periodo) {
      solicitud.periodo = this.calcularPeriodo(ingreso, fechaSolicitud);
    };
    solicitud.empresaId = empresaId;
    solicitud.id = solicitud.id || uuid();

    return this.afs
      .collection(`empresas/${empresaId}/vacaciones`)
      .doc(solicitud.id)
      .set(solicitud);
  }

  /** Método que nos permite obtener las solicitudes de vacaciones de un empleado*/
  public obtenerSolicitudesEmpleado(empleadoId: string) {
    const empresaId = this.obtenerEmpresaCedula();

    return this.afs
      .collection<SolicitudVacaciones>(
        `empresas/${empresaId}/vacaciones`,
        ref => ref
          .where('empleadoId', '==', empleadoId)
          .orderBy('periodo', 'desc') //MÁS RECIENTE PRIMERO
      )
      .valueChanges({ idField: 'id' });
  }

  /** Método que nos permite eliminar la solicitud de un empleado*/
  public eliminarSolicitud(id: string) {
    const empresaId = this.obtenerEmpresaCedula();
    return this.afs
      .collection(`empresas/${empresaId}/vacaciones`)
      .doc(id)
      .delete();
  }

  /** Método que nos permite obtener los días pendientes de vacaciones de un empleado*/
  public calcularDiasPendientes(empleado: any, planillas: any[]): Observable<any> {

    // ==================================================================
    // 🔹 EMPLEADO DIARIO CADA 22 DÍAS TIENE 1 DÍA DE VACACIONES
    // ==================================================================
    if (empleado.tipoPago === 'diario') {
      return of(
        this.calcularVacacionesDiario(
          empleado.id,
          new Date(empleado.fechaIngreso),
          planillas
        )
      );
    }

    // ====================================================
    // 🔹 EMPLEADO MENSUAL ( LÓGICA ACTUAL) 1 DÍA POR MES
    // ====================================================
    const ingreso = new Date(empleado.fechaIngreso);

    return this.obtenerSolicitudesEmpleado(empleado.id).pipe(
      map((solicitudes: SolicitudVacaciones[]) => {
        const hoy = new Date();

        let inicio = new Date(ingreso);
        let fin = new Date(inicio);
        fin.setFullYear(fin.getFullYear() + 1);

        const resultado: any = {};

        while (inicio <= hoy) {
          const periodo = `${inicio.getFullYear()}-${fin.getFullYear()}`;

          const meses = this.calcularMesesDentroPeriodo(
            inicio,
            fin,
            hoy,
            ingreso
          );

          const diasGanados = Math.min(meses, 12);

          const diasTomados = solicitudes
            .filter(s => s.periodo === periodo)
            .reduce((t, x) => t + x.diasSolicitados, 0);

          resultado[periodo] = Math.max(diasGanados - diasTomados, 0);

          inicio = new Date(fin);
          fin.setFullYear(fin.getFullYear() + 1);
        }

        return resultado;
      })
    );
  }


  /** Método que nos permite obtener los meses dentro de un periodo*/
  private calcularMesesDentroPeriodo(inicio: Date, fin: Date, hoy: Date, ingresoReal: Date): number {
    const desde = inicio < ingresoReal ? ingresoReal : inicio;
    const hasta = hoy < fin ? hoy : fin;

    let meses =
      (hasta.getFullYear() - desde.getFullYear()) * 12 +
      (hasta.getMonth() - desde.getMonth());

    if (hasta.getDate() < desde.getDate()) meses--;

    return Math.max(meses, 0);
  }

  /** Método que nos permite obtener los días dentro de un periodo*/
  private calcularDiasDentroPeriodo(inicioInc: Date, finInc: Date, inicioPeriodo: Date, finPeriodo: Date): number {

    const desde = inicioInc > inicioPeriodo ? inicioInc : inicioPeriodo;
    const hasta = finInc < finPeriodo ? finInc : finPeriodo;

    if (desde > hasta) return 0;

    const diff =
      (hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24) + 1;

    return Math.max(Math.floor(diff), 0);
  }

  /** Método que nos permite obtener los días trabajados de un empleado diario*/
  public calcularVacacionesDiario(empleadoId: number, fechaIngreso: Date, planillas: any[]): any {

    const resultado: any = {};

    // Agrupar días trabajados por periodo
    const diasPorPeriodo: { [periodo: string]: number } = {};

    for (const p of planillas) {
      const detalle = p.detalleEmpleados.find((d: any) => d.id === empleadoId);
      if (!detalle) continue;

      const dias = detalle.diasTrabajados || 0;
      if (dias === 0) continue;

      const fechaPlanilla = new Date(p.mes + '-01');
      const periodo = this.calcularPeriodo(fechaIngreso, fechaPlanilla);

      diasPorPeriodo[periodo] = (diasPorPeriodo[periodo] || 0) + dias;
    }

    // Convertir días trabajados a días de vacaciones
    Object.keys(diasPorPeriodo).forEach(periodo => {
      resultado[periodo] = Math.floor(diasPorPeriodo[periodo] / 22);
    });

    return resultado;
  }

  /** Método que nos permite calcular los días al empleado mensual ordinario*/
  public calcularDiasPendientesSinPlanillas(empleado: any): Observable<any> {

    // 🔹 SOLO EMPLEADOS MENSUALES
    if (empleado.tipoPago === 'diario') {
      return of({});
    }

    const ingreso = new Date(empleado.fechaIngreso);

    return combineLatest([
      this.obtenerSolicitudesEmpleado(empleado.id),
      this.incapacidadesService.obtenerPorEmpleado(empleado.id)
    ]).pipe(
      map(([solicitudes, incapacidades]) => {

        const hoy = new Date();

        let inicio = new Date(ingreso);
        let fin = new Date(inicio);
        fin.setFullYear(fin.getFullYear() + 1);

        const resultado: any = {};

        while (inicio <= hoy) {

          const periodo = `${inicio.getFullYear()}-${fin.getFullYear()}`;

          // 🔹 1️⃣ Meses normalmente ganados
          const mesesTrabajados = this.calcularMesesDentroPeriodo(
            inicio,
            fin,
            hoy,
            ingreso
          );

          let diasGanados = Math.min(mesesTrabajados, 12);

          // 🔹 2️⃣ Días de incapacidad válidos dentro del período
          const diasIncapacidad = incapacidades
            .filter(i =>
              ['enfermedad', 'accidente', 'permisosg'].includes(i.tipo)
            )
            .map(i => this.calcularDiasDentroPeriodo(
              new Date(i.fechaInicio),
              new Date(i.fechaFin),
              inicio,
              fin
            ))
            .reduce((a, b) => a + b, 0);

          // 🔹 3️⃣ Convertir incapacidades a meses NO trabajados
          const mesesNoTrabajados = Math.floor(diasIncapacidad / 30);

          diasGanados = Math.max(diasGanados - mesesNoTrabajados, 0);

          // 🔹 4️⃣ Días ya tomados
          const diasTomados = solicitudes
            .filter(s => s.periodo === periodo)
            .reduce((t, x) => t + x.diasSolicitados, 0);

          resultado[periodo] = Math.max(diasGanados - diasTomados, 0);

          inicio = new Date(fin);
          fin.setFullYear(fin.getFullYear() + 1);
        }

        return resultado;
      })
    );
  }

}


