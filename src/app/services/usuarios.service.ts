import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, collection, doc, setDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { environment } from 'src/environments/environment';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private firebaseUrl = environment.firebase.projectId;
  private functionsUrl = `https://us-central1-${this.firebaseUrl}.cloudfunctions.net`;

  constructor(
    private http: HttpClient,
    private firestore: Firestore,
    private auth: Auth
  ) { }

  /**
   * Obtener un usuario por UID
   */
  async obtenerUsuario(uid: string): Promise<Usuario | null> {
    try {
      const usuarioRef = doc(this.firestore, 'usuarios', uid);
      const snapshot = await (await import('@angular/fire/firestore').then(m => m.getDoc))(usuarioRef);

      if (snapshot.exists()) {
        return {
          uid: snapshot.id,
          ...snapshot.data()
        } as Usuario;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  /**
   * Obtener usuario por email
   */
  async obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
          uid: snapshot.docs[0].id,
          ...data
        } as Usuario;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo usuario por email:', error);
      return null;
    }
  }

  /**
   * CREAR USUARIO VÍA CLOUD FUNCTION (con Auth + Firestore)
   * 
   * @param email Email del nuevo usuario
   * @param nombre Nombre completo
   * @param perfil Perfil a asignar (supervisor, administrador, secretario, o custom)
   * @param empresaId ID de la empresa
   * @param createdByUid UID del usuario que lo crea (debe ser supervisor)
   */
  async crearUsuarioCloudFunction(
    email: string,
    nombre: string,
    perfil: string,
    empresaId: string,
    createdByUid: string
  ): Promise<{ success: boolean; uid: string; mensaje: string }> {
    try {
      const response = await this.http.post<any>(
        `${this.functionsUrl}/crearUsuario`,
        {
          email,
          nombre,
          perfil,
          empresaId,
          createdByUid
        }
      ).toPromise();

      return response || { success: false, uid: '', mensaje: 'Error desconocido' };
    } catch (error: any) {
      console.error('Error en Cloud Function:', error);
      throw new Error(error.error?.error || 'Error creando usuario');
    }
  }

  /**
   * Crear empresa
   */
  async crearEmpresa(
    nombre: string,
    cedula: string,
    propietarioId: string,
    plan: string
  ): Promise<any> {
    try {
      const empresaData = {
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
          plan: plan,
          fechaInicio: new Date(),
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          metodoPago: 'pendiente',
          estado: 'activa'
        }
      };

      const empresasRef = collection(this.firestore, 'empresas');
      const docRef = await (await import('@angular/fire/firestore').then(m => m.addDoc))(empresasRef, empresaData);

      return {
        id: docRef.id,
        ...empresaData
      };
    } catch (error) {
      console.error('Error creando empresa:', error);
      throw error;
    }
  }

  /**
   * Crear usuario en Firestore (método local, solo si es necesario)
   */
  async crearUsuarioLocal(
    uid: string,
    email: string,
    nombre: string,
    empresaId: string,
    perfil: string
  ): Promise<void> {
    try {
      const usuarioData = {
        uid,
        email,
        nombre,
        perfil,
        empresaId,
        estado: 'activo',
        createdAt: new Date()
      };

      const usuarioRef = doc(this.firestore, 'usuarios', uid);
      await setDoc(usuarioRef, usuarioData);
    } catch (error) {
      console.error('Error creando usuario local:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios de una empresa
   */
  async obtenerUsuariosEmpresa(empresaId: string): Promise<Usuario[]> {
    try {
      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('empresaId', '==', empresaId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as Usuario));
    } catch (error) {
      console.error('Error obteniendo usuarios de empresa:', error);
      return [];
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async actualizarPerfilUsuario(uid: string, perfil: string): Promise<void> {
    try {
      const usuarioRef = doc(this.firestore, 'usuarios', uid);
      await (await import('@angular/fire/firestore').then(m => m.updateDoc))(usuarioRef, {
        perfil: perfil
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  async desactivarUsuario(uid: string): Promise<void> {
    try {
      const usuarioRef = doc(this.firestore, 'usuarios', uid);
      await (await import('@angular/fire/firestore').then(m => m.updateDoc))(usuarioRef, {
        estado: 'inactivo'
      });
    } catch (error) {
      console.error('Error desactivando usuario:', error);
      throw error;
    }
  }

  /**
   * Activar usuario
   */
  async activarUsuario(uid: string): Promise<void> {
    try {
      const usuarioRef = doc(this.firestore, 'usuarios', uid);
      await (await import('@angular/fire/firestore').then(m => m.updateDoc))(usuarioRef, {
        estado: 'activo'
      });
    } catch (error) {
      console.error('Error activando usuario:', error);
      throw error;
    }
  }
}
