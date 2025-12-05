import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { SesionService } from '../services/sesion.service';

export interface Transaccion {
  id: string;
  tipo: 'ingreso' | 'gasto';
  descripcion: string;
  monto: number;
  fecha: string;
  mes: string;
  categoria: string;
}

@Injectable({ providedIn: 'root' })
export class FinanzasService {

  constructor(
    private afs: AngularFirestore,
    private sesionService: SesionService
  ) { }

  /** 🔹 Obtener cédula activa */
  private getCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  /** 🔹 Obtener lista de transacciones desde Firebase */
  obtener() {
    const cedula = this.getCedula();
    return this.afs
      .collection<Transaccion>(
        `empresas/${cedula}/finanzas`,
        ref => ref.orderBy('fecha', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  /** 🔹 Guardar transacción */
  agregar(t: Transaccion) {
    const cedula = this.getCedula();
    return this.afs
      .collection(`empresas/${cedula}/finanzas`)
      .doc(t.id)
      .set(t);
  }

  /** 🔹 Eliminar transacción */
  eliminar(id: string) {
    const cedula = this.getCedula();
    return this.afs
      .collection(`empresas/${cedula}/finanzas`)
      .doc(id)
      .delete();
  }
}
