import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
import { Empresa } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private empresasCollection = 'empresas';

  constructor(private firestore: Firestore) { }

  /**
   * Obtener todas las empresas (para selector en login)
   */
  async obtenerTodasEmpresas(): Promise<Empresa[]> {
    try {
      const q = query(collection(this.firestore, this.empresasCollection), where('estado', '==', 'activa'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data as Empresa,
          id: doc.id,
          createdAt: data['createdAt']?.toDate() || new Date(),
          suscripcion: {
            ...data['suscripcion'],
            fechaInicio: data['suscripcion']?.fechaInicio?.toDate() || new Date(),
            fechaVencimiento: data['suscripcion']?.fechaVencimiento?.toDate() || new Date()
          }
        };
      });
    } catch (error) {
      throw new Error(`Error al obtener empresas: ${error}`);
    }
  }

  /**
   * Obtener empresas de un usuario propietario
   */
  async obtenerEmpresasUsuario(propietarioId: string): Promise<Empresa[]> {
    try {
      const q = query(
        collection(this.firestore, this.empresasCollection),
        where('propietarioId', '==', propietarioId),
        where('estado', '==', 'activa')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data as Empresa,
          id: doc.id,
          createdAt: data['createdAt']?.toDate() || new Date(),
          suscripcion: {
            ...data['suscripcion'],
            fechaInicio: data['suscripcion']?.fechaInicio?.toDate() || new Date(),
            fechaVencimiento: data['suscripcion']?.fechaVencimiento?.toDate() || new Date()
          }
        };
      });
    } catch (error) {
      throw new Error(`Error al obtener empresas del usuario: ${error}`);
    }
  }
}
