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

  // Registrar la solicitud
  registrarSolicitud(solicitud: SolicitudVacaciones, empleado: any) {
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
  calcularDiasPendientes(empleadoId: string, fechaIngreso: string): Observable<any> {
    const ingreso = new Date(fechaIngreso);

    return this.obtenerSolicitudesEmpleado(empleadoId).pipe(
      map((solicitudes: SolicitudVacaciones[]) => {
        const hoy = new Date();

        let inicio = new Date(ingreso);
        let fin = new Date(inicio);
        fin.setFullYear(fin.getFullYear() + 1);

        const resultado: any = {};

        while (inicio <= hoy) {
          const periodo = `${inicio.getFullYear()}-${fin.getFullYear()}`;

          // Calcular meses dentro del periodo
          const meses = this.calcularMesesDentroPeriodo(inicio, fin, hoy, ingreso);

          const diasGanados = Math.min(meses, 12);

          const diasTomados = solicitudes
            .filter(s => s.periodo === periodo)
            .reduce((t, x) => t + x.diasSolicitados, 0);

          const diasPendientes = Math.max(diasGanados - diasTomados, 0);

          resultado[periodo] = diasPendientes;

          // Pasar al siguiente periodo
          inicio = new Date(fin);
          fin.setFullYear(fin.getFullYear() + 1);
        }

        return resultado;
      })
    );
  }

  private calcularMesesDentroPeriodo(inicio: Date, fin: Date, hoy: Date, ingresoReal: Date): number {
    const desde = inicio < ingresoReal ? ingresoReal : inicio;
    const hasta = hoy < fin ? hoy : fin;

    let meses =
      (hasta.getFullYear() - desde.getFullYear()) * 12 +
      (hasta.getMonth() - desde.getMonth());

    if (hasta.getDate() < desde.getDate()) meses--;

    return Math.max(meses, 0);
  }


}


