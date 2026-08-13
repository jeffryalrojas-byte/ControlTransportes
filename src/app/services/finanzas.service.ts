import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from '@angular/fire/firestore';
import { SesionService } from '../services/sesion.service';
import { Observable } from 'rxjs';

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
    private firestore: Firestore,
    private sesionService: SesionService
  ) { }

  /** 🔹 Obtener cédula activa */
  private getCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  /** 🔹 Obtener lista de transacciones desde Firebase */
  obtener(): Observable<Transaccion[]> {
    const cedula = this.getCedula();
    
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${cedula}/finanzas`),
        orderBy('fecha', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Transaccion[];
        observer.next(data);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  /** 🔹 Guardar transacción */
  agregar(t: Transaccion) {
    const cedula = this.getCedula();
    const docRef = doc(this.firestore, `empresas/${cedula}/finanzas/${t.id}`);
    return setDoc(docRef, t);
  }

  /** 🔹 Eliminar transacción */
  eliminar(id: string) {
    const cedula = this.getCedula();
    const docRef = doc(this.firestore, `empresas/${cedula}/finanzas/${id}`);
    return deleteDoc(docRef);
  }
}
