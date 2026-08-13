import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, onSnapshot, query, orderBy, addDoc } from '@angular/fire/firestore';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';
import { obtenerEmpresaId } from './empresa-utils';

export interface CargasSociales {
  ccssTrabajador: number;
  ccssPatrono: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

  constructor(private firestore: Firestore) { }

  private getEmpresaId(): string {
    return obtenerEmpresaId();
  }

  // ==================== CARGAS SOCIALES ====================
  guardarCargas(cargas: CargasSociales) {
    const empresaId = this.getEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/configuracion/cargasSociales`);
    return setDoc(docRef, cargas, { merge: true });
  }

  obtenerCargas(): Observable<CargasSociales | undefined> {
    const empresaId = this.getEmpresaId();

    return new Observable(observer => {
      const docRef = doc(this.firestore, `empresas/${empresaId}/configuracion/cargasSociales`);
      
      const unsubscribe = onSnapshot(docRef, (snap) => {
        observer.next(snap.data() as CargasSociales | undefined);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  // ==================== INCENTIVOS ====================
  guardarIncentivos(incentivos: { [puesto: string]: number }) {
    const empresaId = this.getEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/configuracion/incentivos`);
    return setDoc(docRef, incentivos, { merge: true });
  }

  obtenerIncentivos(): Observable<{ [puesto: string]: number } | undefined> {
    const empresaId = this.getEmpresaId();

    return new Observable(observer => {
      const docRef = doc(this.firestore, `empresas/${empresaId}/configuracion/incentivos`);
      
      const unsubscribe = onSnapshot(docRef, (snap) => {
        observer.next(snap.data() as { [puesto: string]: number } | undefined);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  // ==================== HISTÓRICO ====================
  guardarHistorico(cargas: CargasSociales) {
    const empresaId = this.getEmpresaId();
    const registro = {
      ...cargas,
      fecha: new Date().toLocaleString()
    };

    const colRef = collection(this.firestore, `empresas/${empresaId}/configuracion_historico`);
    return addDoc(colRef, registro);
  }

  obtenerHistorico(): Observable<any[]> {
    const empresaId = this.getEmpresaId();

    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${empresaId}/configuracion_historico`),
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

  // ==================== LOGO PERSONALIZADO (BASE64 EN FIRESTORE) ====================
  
  /**
   * Convierte archivo a Base64 y guarda en Firestore
   * ✅ Sin CORS, funciona en plan Spark
   */
  async subirLogo(archivo: File): Promise<string> {
    const empresaId = this.getEmpresaId();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e: any) => {
        try {
          const base64 = e.target.result;
          
          // Guardar en Firestore
          const docRef = doc(this.firestore, `empresas/${empresaId}/configuracion/logo`);
          await setDoc(docRef, { 
            base64,
            fechaSubida: new Date().toLocaleString(),
            tipo: archivo.type,
            nombre: archivo.name
          }, { merge: true });
          
          resolve(base64);
        } catch (error) {
          reject(new Error(`Error al guardar logo: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsDataURL(archivo);
    });
  }

  /**
   * Obtiene logo en base64 desde Firestore
   */
  obtenerLogo(): Observable<{ base64: string; fechaSubida: string; tipo: string } | undefined> {
    const empresaId = this.getEmpresaId();

    return new Observable(observer => {
      const docRef = doc(this.firestore, `empresas/${empresaId}/configuracion/logo`);
      
      const unsubscribe = onSnapshot(docRef, (snap) => {
        observer.next(snap.data() as { base64: string; fechaSubida: string; tipo: string } | undefined);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }
}
