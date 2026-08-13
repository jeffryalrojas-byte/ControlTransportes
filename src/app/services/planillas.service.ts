import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, where, onSnapshot, getDocs } from '@angular/fire/firestore';
import { SesionService } from './sesion.service';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';

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

  constructor(
    private firestore: Firestore,
    private sesionService: SesionService
  ) { }

  private obtenerEmpresaCedula() {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  obtener(): Observable<any[]> {
    const cedulaEmpresa = this.obtenerEmpresaCedula();
    
    return new Observable(observer => {
      const colRef = collection(this.firestore, `empresas/${cedulaEmpresa}/planillas`);
      
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
    const cedulaEmpresa = this.obtenerEmpresaCedula();
    const id = planilla.id ?? uuid();

    const data: Planilla = {
      ...planilla,
      id
    };

    const docRef = doc(this.firestore, `empresas/${cedulaEmpresa}/planillas/${id}`);
    return setDoc(docRef, data);
  }

  eliminar(id: string) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();
    const docRef = doc(this.firestore, `empresas/${cedulaEmpresa}/planillas/${id}`);
    return deleteDoc(docRef);
  }

  /** Verifica si ya existe una planilla registrada para el mes */
  async existePlanillaMes(mes: string) {
    const cedula = this.obtenerEmpresaCedula();
    const q = query(
      collection(this.firestore, `empresas/${cedula}/planillas`),
      where('mes', '==', mes)
    );
    
    return getDocs(q);
  }

  /** Método que nos permite obtener los días trabajados de un empleado*/
  obtenerDiasTrabajadosPorEmpleado(empleadoId: number): Observable<any[]> {
    const empresaId = this.sesionService.getCedulaEmpresaActual();

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
