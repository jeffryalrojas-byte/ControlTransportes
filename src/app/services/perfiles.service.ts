import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc } from '@angular/fire/firestore';
import { Perfil, PERFILES_DEFAULT, PERMISOS_DISPONIBLES } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class PerfilesService {
  constructor(private firestore: Firestore) { }

  /**
   * Obtener todos los perfiles disponibles (defaults + custom)
   */
  async obtenerTodos(empresaId?: string): Promise<Perfil[]> {
    const perfiles: Perfil[] = [];

    // Agregar perfiles por defecto
    perfiles.push(...Object.values(PERFILES_DEFAULT));

    // Si hay empresaId, obtener perfiles personalizados
    if (empresaId) {
      try {
        const perfilesRef = collection(this.firestore, 'perfiles');
        const q = query(perfilesRef, where('empresaId', '==', empresaId));
        const snapshot = await getDocs(q);

        snapshot.docs.forEach(doc => {
          perfiles.push({
            id: doc.id,
            ...doc.data()
          } as Perfil);
        });
      } catch (error) {
        console.error('Error obteniendo perfiles personalizados:', error);
      }
    }

    return perfiles;
  }

  /**
   * Obtener un perfil por ID
   */
  async obtenerPerfil(perfilId: string, empresaId?: string): Promise<Perfil | null> {
    // Si es un perfil default
    if (PERFILES_DEFAULT[perfilId]) {
      return PERFILES_DEFAULT[perfilId];
    }

    // Si es personalizado, buscar en Firestore
    if (empresaId) {
      try {
        const perfilRef = doc(this.firestore, `empresas/${empresaId}/perfiles/${perfilId}`);
        const snapshot = await getDoc(perfilRef);

        if (snapshot.exists()) {
          return {
            id: snapshot.id,
            ...snapshot.data()
          } as Perfil;
        }
      } catch (error) {
        console.error('Error obteniendo perfil:', error);
      }
    }

    return null;
  }

  /**
   * Verificar si un usuario tiene un permiso específico
   */
  async tienePermiso(usuarioId: string, permiso: string, empresaId: string): Promise<boolean> {
    try {
      // Obtener usuario
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('uid', '==', usuarioId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return false;

      const usuario = snapshot.docs[0].data();
      const perfilId = usuario['perfil'];

      // Obtener perfil
      const perfil = await this.obtenerPerfil(perfilId, empresaId);
      if (!perfil) return false;

      // Verificar si tiene el permiso
      return perfil.permisos.includes(permiso);
    } catch (error) {
      console.error('Error verificando permiso:', error);
      return false;
    }
  }

  /**
   * Obtener permisos de un perfil
   */
  async obtenerPermisosDelPerfil(perfilId: string, empresaId?: string): Promise<string[]> {
    const perfil = await this.obtenerPerfil(perfilId, empresaId);
    return perfil ? perfil.permisos : [];
  }

  /**
   * Crear un perfil personalizado
   */
  async crearPerfil(perfil: Omit<Perfil, 'id' | 'createdAt' | 'updatedAt'>, empresaId: string): Promise<Perfil> {
    try {
      const perfilesRef = collection(this.firestore, `empresas/${empresaId}/perfiles`);
      const docRef = await addDoc(perfilesRef, {
        ...perfil,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        id: docRef.id,
        ...perfil,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creando perfil:', error);
      throw error;
    }
  }

  /**
   * Actualizar un perfil
   */
  async actualizarPerfil(perfilId: string, perfil: Partial<Perfil>, empresaId: string): Promise<void> {
    try {
      const perfilRef = doc(this.firestore, `empresas/${empresaId}/perfiles/${perfilId}`);
      await updateDoc(perfilRef, {
        ...perfil,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  /**
   * Eliminar un perfil
   */
  async eliminarPerfil(perfilId: string, empresaId: string): Promise<void> {
    try {
      // No permitir eliminar perfiles por defecto
      if (PERFILES_DEFAULT[perfilId]) {
        throw new Error('No se pueden eliminar perfiles por defecto');
      }

      const perfilRef = doc(this.firestore, `empresas/${empresaId}/perfiles/${perfilId}`);
      await deleteDoc(perfilRef);
    } catch (error) {
      console.error('Error eliminando perfil:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de permisos disponibles
   */
  obtenerPermisosDisponibles(): { [key: string]: string } {
    return PERMISOS_DISPONIBLES;
  }

  /**
   * Agrupar permisos por módulo para UI
   */
  agruparPermisosPorModulo(): { [modulo: string]: string[] } {
    const agrupados: { [modulo: string]: string[] } = {
      'RRHH': [],
      'PLANILLA': [],
      'FINANZAS': [],
      'VACACIONES': [],
      'INCAPACIDADES': [],
      'CONFIGURACIÓN': [],
      'PAGOS': [],
      'REPORTERÍA': []
    };

    Object.keys(PERMISOS_DISPONIBLES).forEach(permiso => {
      if (permiso.startsWith('ver_empleados') || permiso.startsWith('crear_empleado') || permiso.startsWith('editar_empleado') || permiso.startsWith('eliminar_empleado') || permiso.startsWith('ver_datos_empleado')) {
        agrupados['RRHH'].push(permiso);
      } else if (permiso.startsWith('ver_planilla') || permiso.startsWith('crear_planilla') || permiso.startsWith('editar_planilla') || permiso.startsWith('eliminar_planilla') || permiso.startsWith('generar_planilla')) {
        agrupados['PLANILLA'].push(permiso);
      } else if (permiso.startsWith('ver_finanzas') || permiso.startsWith('crear_finanza') || permiso.startsWith('editar_finanza') || permiso.startsWith('eliminar_finanza') || permiso.startsWith('ver_reportes_finanzas')) {
        agrupados['FINANZAS'].push(permiso);
      } else if (permiso.startsWith('ver_vacaciones') || permiso.startsWith('solicitar_vacaciones') || permiso.startsWith('aprobar_vacaciones') || permiso.startsWith('rechazar_vacaciones') || permiso.startsWith('editar_vacaciones') || permiso.startsWith('eliminar_vacaciones')) {
        agrupados['VACACIONES'].push(permiso);
      } else if (permiso.startsWith('ver_incapacidades') || permiso.startsWith('solicitar_incapacidad') || permiso.startsWith('aprobar_incapacidad') || permiso.startsWith('rechazar_incapacidad') || permiso.startsWith('editar_incapacidad') || permiso.startsWith('eliminar_incapacidad')) {
        agrupados['INCAPACIDADES'].push(permiso);
      } else if (permiso.startsWith('ver_configuracion') || permiso.startsWith('editar_logo') || permiso.startsWith('editar_cargas') || permiso.startsWith('agregar_incentivos') || permiso.startsWith('gestionar_usuarios') || permiso.startsWith('gestionar_perfiles')) {
        agrupados['CONFIGURACIÓN'].push(permiso);
      } else if (permiso.startsWith('ver_pagos') || permiso.startsWith('procesar_pago')) {
        agrupados['PAGOS'].push(permiso);
      } else if (permiso.startsWith('ver_reporteria') || permiso.startsWith('exportar_reportes')) {
        agrupados['REPORTERÍA'].push(permiso);
      }
    });

    return agrupados;
  }
}
