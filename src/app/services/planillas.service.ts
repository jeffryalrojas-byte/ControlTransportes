import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, where, onSnapshot, getDocs } from '@angular/fire/firestore';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';
import { obtenerEmpresaId } from './empresa-utils';

export interface Planilla {
  id?: string;
  mes: string;
  fechaCreacion: string;
  totalNeto: number;
  totalCargas: number;
  detalleEmpleados: { id: string | number; salarioNeto: number }[];
  empresaCedula: string;
}

@Injectable({ providedIn: 'root' })
export class PlanillasService {

  constructor(private firestore: Firestore) { }

  private obtenerEmpresaId() {
    return obtenerEmpresaId();
  }

  obtener(): Observable<any[]> {
    const empresaId = this.obtenerEmpresaId();
    
    return new Observable(observer => {
      const colRef = collection(this.firestore, `empresas/${empresaId}/planillas`);
      
      const unsubscribe = onSnapshot(colRef, (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        observer.next(data);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  agregar(planilla: Planilla) {
    const empresaId = this.obtenerEmpresaId();
    const id = planilla.id ?? uuid();

    const data: Planilla = {
      ...planilla,
      id
    };

    const docRef = doc(this.firestore, `empresas/${empresaId}/planillas/${id}`);
    return setDoc(docRef, data);
  }

  eliminar(id: string) {
    const empresaId = this.obtenerEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/planillas/${id}`);
    return deleteDoc(docRef);
  }

  async existePlanillaMes(mes: string) {
    const empresaId = this.obtenerEmpresaId();
    const q = query(
      collection(this.firestore, `empresas/${empresaId}/planillas`),
      where('mes', '==', mes)
    );
    
    return getDocs(q);
  }

  obtenerDiasTrabajadosPorEmpleado(empleadoId: number): Observable<any[]> {
    const empresaId = this.obtenerEmpresaId();

    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${empresaId}/planillas`),
        where('detalleEmpleados', 'array-contains', { id: empleadoId })
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        observer.next(data);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }
}
