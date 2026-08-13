import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { obtenerEmpresaId } from './empresa-utils';

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

  constructor(private firestore: Firestore) { }

  private getEmpresaId(): string {
    return obtenerEmpresaId();
  }

  obtener(): Observable<Transaccion[]> {
    const empresaId = this.getEmpresaId();
    
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${empresaId}/finanzas`),
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

  agregar(t: Transaccion) {
    const empresaId = this.getEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/finanzas/${t.id}`);
    return setDoc(docRef, t);
  }

  eliminar(id: string) {
    const empresaId = this.getEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/finanzas/${id}`);
    return deleteDoc(docRef);
  }
}
