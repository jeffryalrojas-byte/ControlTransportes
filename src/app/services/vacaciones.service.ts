import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { v4 as uuid } from 'uuid';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SesionService } from './sesion.service';

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
    private sesionService: SesionService
  ) { }

  // Obtener la empresa actual
  private obtenerEmpresaCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  // Calcular el período de vacaciones, por ejemplo: "2023-2024"
  private calcularPeriodo(fechaIngreso: Date, fechaSolicitud: Date): string {
    let inicio = new Date(fechaIngreso);
    let fin = new Date(inicio);
    fin.setFullYear(fin.getFullYear() + 1);

    while (fechaSolicitud >= fin) {
      inicio = new Date(fin);
      fin.setFullYear(fin.getFullYear() + 1);
    }

    return `${inicio.getFullYear()}-${fin.getFullYear()}`;
  }

  // Registrar la solicitud
  registrarSolicitud(solicitud: SolicitudVacaciones, empleado: any) {
    const empresaId = this.obtenerEmpresaCedula();
    const ingreso = new Date(empleado.fechaIngreso);
    const fechaSolicitud = new Date(solicitud.fechaInicio);

    solicitud.periodo = this.calcularPeriodo(ingreso, fechaSolicitud);
    solicitud.empresaId = empresaId;
    solicitud.id = solicitud.id || uuid();

    return this.afs
      .collection(`empresas/${empresaId}/vacaciones`)
      .doc(solicitud.id)
      .set(solicitud);
  }

  // Obtener solicitudes del empleado
  obtenerSolicitudesEmpleado(empleadoId: string) {
    const empresaId = this.obtenerEmpresaCedula();

    return this.afs
      .collection<SolicitudVacaciones>(
        `empresas/${empresaId}/vacaciones`,
        ref => ref.where('empleadoId', '==', empleadoId)
      )
      .valueChanges({ idField: 'id' });
  }

  // Eliminar solicitud
  eliminarSolicitud(id: string) {
    const empresaId = this.obtenerEmpresaCedula();
    return this.afs
      .collection(`empresas/${empresaId}/vacaciones`)
      .doc(id)
      .delete();
  }

  // ✔ CALCULAR DÍAS PENDIENTES (FUNCIONA SIN ERRORES)
  calcularDiasPendientes(empleadoId: string, fechaIngreso: string): Observable<number> {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();

    if (isNaN(ingreso.getTime())) {
      return new Observable(sub => sub.next(0));
    }

    // ✔ Cálculo de meses real y sin errores por zona horaria
    // Calcular meses trabajados de forma precisa
    let mesesTrabajados =
      (hoy.getFullYear() - ingreso.getFullYear()) * 12 +
      (hoy.getMonth() - ingreso.getMonth());

    // verificar si aún no llegó al día de ingreso este mes
    if (hoy.getDate() < ingreso.getDate()) {
      mesesTrabajados--;
    }

    mesesTrabajados = Math.max(mesesTrabajados, 0);

    // 1 día por mes trabajado, máximo 12 por periodo
    const diasGanados = Math.min(mesesTrabajados, 12);


    return this.obtenerSolicitudesEmpleado(empleadoId).pipe(
      map(solicitudes => {
        const diasTomados = solicitudes.reduce((t, s) => t + s.diasSolicitados, 0);
        return Math.max(diasGanados - diasTomados, 0);
      })
    );
  }

}


