import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Usuario, Empresa } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class SesionService {
  constructor(private firestore: Firestore) { }

  getUsuarioActivo(): Usuario | null {
    const data = localStorage.getItem('usuarioActivo');
    return data ? JSON.parse(data) : null;
  }

  getEmpresaIdActiva(): string | null {
    return localStorage.getItem('empresaActiva');
  }

  getEmpresaActual(): string | null {
    const user = this.getUsuarioActivo();
    return user ? user.nombre : null; // nombre del usuario, no de empresa
  }

  async obtenerEmpresaActual(): Promise<Empresa | null> {
    const empresaId = this.getEmpresaIdActiva();
    if (!empresaId) return null;

    try {
      const empresaRef = doc(this.firestore, 'empresas', empresaId);
      const empresaSnap = await getDoc(empresaRef);

      if (empresaSnap.exists()) {
        const data = empresaSnap.data();
        return {
          id: empresaSnap.id,
          nombre: data['nombre'],
          cedula: data['cedula'],
          plan: data['plan'],
          propietarioId: data['propietarioId'],
          estado: data['estado'],
          empleadosCount: data['empleadosCount'],
          usuariosCount: data['usuariosCount'],
          almacenamientoUsado: data['almacenamientoUsado'],
          createdAt: data['createdAt']?.toDate() || new Date(),
          suscripcion: data['suscripcion']
        } as Empresa;
      }
    } catch (error) {
      console.error('Error obteniendo empresa:', error);
    }
    return null;
  }

  getCedulaEmpresaActual(): string | null {
    // Esta función ahora es async en obtenerEmpresaActual
    // Para compatibilidad temporal:
    return null;
  }
}
