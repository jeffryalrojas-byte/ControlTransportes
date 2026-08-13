import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, onSnapshot, query, orderBy, addDoc } from '@angular/fire/firestore';
import { SesionService } from '../services/sesion.service';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';

export interface CargasSociales {
  ccssTrabajador: number;
  ccssPatrono: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

  constructor(
    private firestore: Firestore,
    private sesionService: SesionService
  ) { }

  /** 🔹 Obtiene cédula de empresa */
  private getEmpresaCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  /** 🔹 Guarda cargar sociales en Firebase */
  guardarCargas(cargas: CargasSociales) {
    const cedula = this.getEmpresaCedula();
    const docRef = doc(this.firestore, `empresas/${cedula}/configuracion/cargasSociales`);
    return setDoc(docRef, cargas, { merge: true });
  }

  /** 🔹 Obtiene cargas desde Firebase */
  obtenerCargas(): Observable<CargasSociales | undefined> {
    const cedula = this.getEmpresaCedula();

    return new Observable(observer => {
      const docRef = doc(this.firestore, `empresas/${cedula}/configuracion/cargasSociales`);
      
      const unsubscribe = onSnapshot(docRef, (snap) => {
        observer.next(snap.data() as CargasSociales | undefined);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  guardarIncentivos(incentivos: { [puesto: string]: number }) {
    const cedula = this.getEmpresaCedula();
    const docRef = doc(this.firestore, `empresas/${cedula}/configuracion/incentivos`);
    return setDoc(docRef, incentivos, { merge: true });
  }

  obtenerIncentivos(): Observable<{ [puesto: string]: number } | undefined> {
    const cedula = this.getEmpresaCedula();

    return new Observable(observer => {
      const docRef = doc(this.firestore, `empresas/${cedula}/configuracion/incentivos`);
      
      const unsubscribe = onSnapshot(docRef, (snap) => {
        observer.next(snap.data() as { [puesto: string]: number } | undefined);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  /** 🔹 Guarda histórico en Firebase */
  guardarHistorico(cargas: CargasSociales) {
    const cedula = this.getEmpresaCedula();
    const registro = {
      ...cargas,
      fecha: new Date().toLocaleString()
    };

    const colRef = collection(this.firestore, `empresas/${cedula}/configuracion/cargasSociales/historicoCargas`);
    return addDoc(colRef, registro);
  }

  /** 🔹 Obtiene el histórico de Firebase */
  obtenerHistorico(): Observable<any[]> {
    const cedula = this.getEmpresaCedula();

    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${cedula}/configuracion/cargasSociales/historicoCargas`),
        orderBy('fecha', 'desc')
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
