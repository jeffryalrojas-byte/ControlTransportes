import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, where, orderBy, onSnapshot } from '@angular/fire/firestore';
import { v4 as uuid } from 'uuid';
import { map, Observable, of } from 'rxjs';
import { IncapacidadesService } from './incapacidades.service';
import { obtenerEmpresaId } from './empresa-utils';

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

  constructor(
    private firestore: Firestore,
    private incapacidadesService: IncapacidadesService
  ) { }

  private obtenerEmpresaId(): string {
    return obtenerEmpresaId();
  }

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

  public registrarSolicitud(solicitud: SolicitudVacaciones, empleado: any) {
    const empresaId = this.obtenerEmpresaId();
    const ingreso = new Date(empleado.fechaIngreso);
    const fechaSolicitud = new Date(solicitud.fechaInicio);

    if (!solicitud.periodo) {
      solicitud.periodo = this.calcularPeriodo(ingreso, fechaSolicitud);
    }
    solicitud.empresaId = empresaId;
    solicitud.id = solicitud.id || uuid();

    const docRef = doc(this.firestore, `empresas/${empresaId}/vacaciones/${solicitud.id}`);
    return setDoc(docRef, solicitud);
  }

  public obtenerSolicitudesEmpleado(empleadoId: string): Observable<SolicitudVacaciones[]> {
    const empresaId = this.obtenerEmpresaId();
    
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${empresaId}/vacaciones`),
        where('empleadoId', '==', empleadoId),
        orderBy('periodo', 'desc'),
        orderBy('fechaInicio', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as SolicitudVacaciones[];
        observer.next(data);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  public eliminarSolicitud(id: string) {
    const empresaId = this.obtenerEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/vacaciones/${id}`);
    return deleteDoc(docRef);
  }

  public calcularDiasPendientes(empleado: any, planillas: any[]): Observable<any> {
    if (empleado.tipoPago === 'diario') {
      return of(
        this.calcularVacacionesDiario(
          empleado.id,
          new Date(empleado.fechaIngreso),
          planillas
        )
      );
    }

    const ingreso = new Date(empleado.fechaIngreso);

    return this.obtenerSolicitudesEmpleado(empleado.id).pipe(
      map((solicitudes: SolicitudVacaciones[]) => {
        let fechaCalculo = new Date();

        if (
          empleado.tipoContrato === 'definido' &&
          empleado.fechaFinContrato
        ) {
          const fechaFin = new Date(empleado.fechaFinContrato);
          if (fechaFin < fechaCalculo) {
            fechaCalculo = fechaFin;
          }
        }

        let inicio = new Date(ingreso);
        let fin = new Date(inicio);
        fin.setFullYear(fin.getFullYear() + 1);

        const resultado: any = {};

        while (inicio <= fechaCalculo) {
          const periodo = `${inicio.getFullYear()}-${fin.getFullYear()}`;

          const meses = this.calcularMesesDentroPeriodo(
            inicio,
            fin,
            fechaCalculo,
            ingreso
          );

          const diasGanados = Math.min(meses, 12);

          const diasTomados = solicitudes
            .filter((s) => s.periodo === periodo)
            .reduce((t, x) => t + x.diasSolicitados, 0);

          resultado[periodo] = Math.max(diasGanados - diasTomados, 0);

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

  private calcularDiasDentroPeriodo(inicioInc: Date, finInc: Date, inicioPeriodo: Date, finPeriodo: Date): number {
    const desde = inicioInc > inicioPeriodo ? inicioInc : inicioPeriodo;
    const hasta = finInc < finPeriodo ? finInc : finPeriodo;

    if (desde > hasta) return 0;

    const diff =
      (hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24) + 1;

    return Math.max(Math.floor(diff), 0);
  }

  public calcularVacacionesDiario(empleadoId: any, fechaIngreso: Date, planillas: any[]): any {
    const resultado: any = {};
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

    Object.keys(diasPorPeriodo).forEach(periodo => {
      resultado[periodo] = Math.floor(diasPorPeriodo[periodo] / 22);
    });

    return resultado;
  }

  public calcularDiasPendientesSinPlanillas(empleado: any): Observable<any> {
    if (empleado.tipoPago === 'diario') {
      return of({});
    }

    const ingreso = new Date(empleado.fechaIngreso);

    return new Observable(observer => {
      this.obtenerSolicitudesEmpleado(empleado.id).subscribe(solicitudes => {
        this.incapacidadesService.obtenerPorEmpleado(empleado.id).subscribe(incapacidades => {
          let fechaCalculo = new Date();

          if (
            empleado.tipoContrato === 'definido' &&
            empleado.fechaFinContrato
          ) {
            const fechaFin = new Date(empleado.fechaFinContrato);
            if (fechaFin < fechaCalculo) {
              fechaCalculo = fechaFin;
            }
          }

          let inicio = new Date(ingreso);
          let fin = new Date(inicio);
          fin.setFullYear(fin.getFullYear() + 1);

          const resultado: any = {};

          while (inicio <= fechaCalculo) {
            const periodo = `${inicio.getFullYear()}-${fin.getFullYear()}`;

            const mesesTrabajados = this.calcularMesesDentroPeriodo(
              inicio,
              fin,
              fechaCalculo,
              ingreso
            );

            let diasGanados = Math.min(mesesTrabajados, 12);

            const diasIncapacidad = incapacidades
              .filter((i: any) =>
                ['enfermedad', 'accidente', 'permisosg'].includes(i.tipo)
              )
              .map((i: any) => this.calcularDiasDentroPeriodo(
                new Date(i.fechaInicio),
                new Date(i.fechaFin),
                inicio,
                fin
              ))
              .reduce((a: number, b: number) => a + b, 0);

            const mesesNoTrabajados = Math.floor(diasIncapacidad / 30);

            diasGanados = Math.max(diasGanados - mesesNoTrabajados, 0);

            const diasTomados = solicitudes
              .filter((s) => s.periodo === periodo)
              .reduce((t: number, x) => t + x.diasSolicitados, 0);

            resultado[periodo] = Math.max(diasGanados - diasTomados, 0);

            inicio = new Date(fin);
            fin.setFullYear(fin.getFullYear() + 1);
          }

          observer.next(resultado);
        });
      });
    });
  }
}
