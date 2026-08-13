import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: Auth) {
    this.setupAuthListener();
  }

  private setupAuthListener(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  /**
   * Registrar nuevo usuario en Firebase Auth
   */
  async registro(email: string, password: string, nombre: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

      // Actualizar perfil con el nombre
      await updateProfile(userCredential.user, {
        displayName: nombre
      });

      return userCredential.user;
    } catch (error) {
      console.log('ERROR COMPLETO DE FIREBASE:', error);

      throw this.handleError(error);
    }
  }

  /**
   * Login con email y contraseña
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Obtener UID del usuario actual
   */
  getCurrentUid(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  /**
   * Obtener token de autenticación
   */
  async getToken(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() || null;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Manejar errores de Firebase Auth
   */
  private handleError(error: any): Error {
    let message = 'Error de autenticación';

    if (error.code === 'auth/email-already-in-use') {
      message = 'Este email ya está registrado';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email inválido';
    } else if (error.code === 'auth/weak-password') {
      message = 'La contraseña debe tener al menos 6 caracteres';
    } else if (error.code === 'auth/user-not-found') {
      message = 'Usuario no encontrado';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Contraseña incorrecta';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Demasiados intentos fallidos. Intenta más tarde';
    }

    return new Error(message);
  }
}
