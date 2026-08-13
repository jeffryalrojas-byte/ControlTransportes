import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, setDoc, query, where, getDocs, updateDoc, Timestamp } from '@angular/fire/firestore';
import { Usuario, Empresa, Plan, PLANES_DISPONIBLES, PERMISOS_POR_ROL } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersCollection = 'users';
  private empresasCollection = 'empresas';
  private planesCollection = 'planes';

  constructor(private firestore: Firestore) {
    this.initializarPlanes();
  }

  async crearUsuario(uid: string, email: string, nombre: string, empresaId: string, rol: 'admin' | 'supervisor' | 'user' = 'user'): Promise<Usuario> {
    try {
      const usuario: Usuario = {
        uid,
        email,
        nombre,
        rol,
        empresaId,
        estado: 'activo',
        createdAt: new Date(),
        permisos: PERMISOS_POR_ROL[rol] || []
      };

      const docRef = doc(this.firestore, this.usersCollection, uid);
      await setDoc(docRef, {
        ...usuario,
        createdAt: Timestamp.fromDate(usuario.createdAt)
      });

      return usuario;
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error}`);
    }
  }

  async obtenerUsuario(uid: string): Promise<Usuario | null> {
    try {
      const docRef = doc(this.firestore, this.usersCollection, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data as Usuario,
          createdAt: data['createdAt']?.toDate() || new Date(),
          lastLogin: data['lastLogin']?.toDate()
        };
      }
      return null;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error}`);
    }
  }

  async obtenerUsuariosEmpresa(empresaId: string): Promise<Usuario[]> {
    try {
      const q = query(collection(this.firestore, this.usersCollection), where('empresaId', '==', empresaId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data as Usuario,
          createdAt: data['createdAt']?.toDate() || new Date(),
          lastLogin: data['lastLogin']?.toDate()
        };
      });
    } catch (error) {
      throw new Error(`Error al obtener usuarios: ${error}`);
    }
  }

  async actualizarLastLogin(uid: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.usersCollection, uid);
      await updateDoc(docRef, {
        lastLogin: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      throw new Error(`Error al actualizar último login: ${error}`);
    }
  }

  async cambiarRol(uid: string, nuevoRol: 'admin' | 'supervisor' | 'user'): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.usersCollection, uid);
      await updateDoc(docRef, {
        rol: nuevoRol,
        permisos: PERMISOS_POR_ROL[nuevoRol]
      });
    } catch (error) {
      throw new Error(`Error al cambiar rol: ${error}`);
    }
  }

  async desactivarUsuario(uid: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.usersCollection, uid);
      await updateDoc(docRef, {
        estado: 'inactivo'
      });
    } catch (error) {
      throw new Error(`Error al desactivar usuario: ${error}`);
    }
  }

  async activarUsuario(uid: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.usersCollection, uid);
      await updateDoc(docRef, {
        estado: 'activo'
      });
    } catch (error) {
      throw new Error(`Error al activar usuario: ${error}`);
    }
  }

  async crearEmpresa(nombre: string, cedula: string, propietarioId: string, plan: 'free' | 'professional' | 'business' = 'free'): Promise<Empresa> {
    try {
      const empresasRef = collection(this.firestore, this.empresasCollection);
      const docRef = await addDoc(empresasRef, {
        nombre,
        cedula,
        propietarioId,
        plan,
        estado: 'activa',
        empleadosCount: 0,
        usuariosCount: 1,
        almacenamientoUsado: 0,
        createdAt: Timestamp.fromDate(new Date()),
        suscripcion: {
          plan,
          fechaInicio: Timestamp.fromDate(new Date()),
          fechaVencimiento: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          metodoPago: 'tarjeta' as const,
          estado: 'activa' as const
        }
      });

      return {
        id: docRef.id,
        nombre,
        cedula,
        propietarioId,
        plan,
        estado: 'activa',
        empleadosCount: 0,
        usuariosCount: 1,
        almacenamientoUsado: 0,
        createdAt: new Date(),
        suscripcion: {
          plan,
          fechaInicio: new Date(),
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          metodoPago: 'tarjeta' as const,
          estado: 'activa' as const
        }
      };
    } catch (error) {
      throw new Error(`Error al crear empresa: ${error}`);
    }
  }

  async obtenerEmpresa(empresaId: string): Promise<Empresa | null> {
    try {
      const docRef = doc(this.firestore, this.empresasCollection, empresaId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data as Empresa,
          id: docSnap.id,
          createdAt: data['createdAt']?.toDate() || new Date(),
          suscripcion: {
            ...data['suscripcion'],
            fechaInicio: data['suscripcion']?.fechaInicio?.toDate() || new Date(),
            fechaVencimiento: data['suscripcion']?.fechaVencimiento?.toDate() || new Date()
          }
        };
      }
      return null;
    } catch (error) {
      throw new Error(`Error al obtener empresa: ${error}`);
    }
  }

  async verificarLimites(empresaId: string, tipo: 'empleados' | 'almacenamiento'): Promise<{ permitido: boolean; usado: number; limite: number }> {
    try {
      const empresa = await this.obtenerEmpresa(empresaId);
      if (!empresa) throw new Error('Empresa no encontrada');

      const plan = PLANES_DISPONIBLES[empresa.plan];

      if (tipo === 'empleados') {
        return {
          permitido: empresa.empleadosCount < plan.limite_empleados,
          usado: empresa.empleadosCount,
          limite: plan.limite_empleados
        };
      } else if (tipo === 'almacenamiento') {
        const almacenamientoEnMB = empresa.almacenamientoUsado / (1024 * 1024);
        return {
          permitido: almacenamientoEnMB < plan.almacenamiento_mb,
          usado: Math.round(almacenamientoEnMB),
          limite: plan.almacenamiento_mb
        };
      }

      return { permitido: false, usado: 0, limite: 0 };
    } catch (error) {
      throw new Error(`Error al verificar límites: ${error}`);
    }
  }

  tieneAccesoModulo(usuario: Usuario, modulo: string): boolean {
    return usuario.permisos.includes(modulo);
  }

  private async initializarPlanes(): Promise<void> {
    try {
      for (const [key, plan] of Object.entries(PLANES_DISPONIBLES)) {
        const docRef = doc(this.firestore, this.planesCollection, key);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          await setDoc(docRef, plan);
        }
      }
    } catch (error) {
      console.error('Error al inicializar planes:', error);
    }
  }
}
