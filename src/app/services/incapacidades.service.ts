// incapacidades.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { SesionService } from '../services/sesion.service';

export interface Incapacidad {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  mes: string;
  tipo: 'enfermedad' | 'accidente' | 'maternidad' | 'permisosg' | 'paternidad';
  numIncapacidad: string;
}

@Injectable({ providedIn: 'root' })
export class IncapacidadesService {

  constructor(
    private afs: AngularFirestore,
    private sesionService: SesionService
  ) { }

  private getCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  /** 🔹 Obtener TODAS las incapacidades de la empresa */
  obtener() {
    const cedula = this.getCedula();
    return this.afs
      .collection<Incapacidad>(
        `empresas/${cedula}/incapacidades`,
        ref => ref.orderBy('fechaInicio', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  /** 🔹 Obtener incapacidades por empleado */
  obtenerPorEmpleado(empleadoId: string) {
    const cedula = this.getCedula();
    return this.afs
      .collection<Incapacidad>(
        `empresas/${cedula}/incapacidades`,
        ref => ref.where('empleadoId', '==', empleadoId).orderBy('fechaInicio', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  /** 🔹 Guardar incapacidad */
  guardar(incapacidad: Incapacidad) {
    const cedula = this.getCedula();
    return this.afs
      .collection(`empresas/${cedula}/incapacidades`)
      .doc(incapacidad.id)
      .set(incapacidad);
  }

  /** 🔹 Eliminar incapacidad */
  eliminar(id: string) {
    const cedula = this.getCedula();
    return this.afs
      .collection(`empresas/${cedula}/incapacidades`)
      .doc(id)
      .delete();
  }
}

