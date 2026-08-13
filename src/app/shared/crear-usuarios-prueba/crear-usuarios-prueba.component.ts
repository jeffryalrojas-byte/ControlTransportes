/**
 * 👤 CREAR USUARIOS DE PRUEBA PARA EMPRESAS MIGRADAS
 */

import { Component } from '@angular/core';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs, doc, setDoc, Timestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PERMISOS_POR_ROL } from '../../models/usuario.model';

@Component({
  selector: 'app-crear-usuarios-prueba',
  template: `
    <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
      <h2>👤 Crear Usuarios de Prueba</h2>
      <p style="color: #999; margin-bottom: 20px;">
        Crea usuarios de prueba para poder loguearte en las empresas migradas.
      </p>

      <button 
        (click)="crearUsuariosPrueba()"
        [disabled]="creando"
        style="padding: 12px 24px; font-size: 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;"
      >
        {{ creando ? 'Creando...' : 'Crear Usuarios de Prueba' }}
      </button>

      <p *ngIf="mensaje" style="margin-top: 20px; font-weight: bold;">
        {{ mensaje }}
      </p>

      <div *ngIf="usuariosCreados.length > 0" style="margin-top: 30px; background: #e8f5e9; padding: 20px; border-radius: 8px;">
        <h3>✅ Usuarios Creados:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ccc;">
            <th style="text-align: left; padding: 8px;">Email</th>
            <th style="text-align: left; padding: 8px;">Contraseña</th>
            <th style="text-align: left; padding: 8px;">Empresa</th>
          </tr>
          <tr *ngFor="let usuario of usuariosCreados" style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px;">{{ usuario.email }}</td>
            <td style="padding: 8px;">{{ usuario.password }}</td>
            <td style="padding: 8px;">{{ usuario.empresa }}</td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class CrearUsuariosPruebaComponent {
  creando = false;
  mensaje = '';
  usuariosCreados: any[] = [];

  usuariosAPrueba = [
    { email: 'admin@transportes-df.com', password: 'Admin123456', nombre: 'Admin D&F', rol: 'admin' as const, empresa: 'Transportes D&F' },
    { email: 'supervisor@transportes-df.com', password: 'Super123456', nombre: 'Super D&F', rol: 'supervisor' as const, empresa: 'Transportes D&F' },
    { email: 'admin@transportes-gya.com', password: 'Admin123456', nombre: 'Admin GyA', rol: 'admin' as const, empresa: 'Transportes GyA' },
    { email: 'supervisor@transportes-gya.com', password: 'Super123456', nombre: 'Super GyA', rol: 'supervisor' as const, empresa: 'Transportes GyA' }
  ];

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private snackBar: MatSnackBar
  ) { }

  async crearUsuariosPrueba(): Promise<void> {
    if (this.creando) return;

    this.creando = true;
    this.mensaje = '⏳ Creando usuarios...';
    this.usuariosCreados = [];

    try {
      for (const userData of this.usuariosAPrueba) {
        const empresasRef = collection(this.firestore, 'empresas');
        const q = query(empresasRef, where('nombre', '==', userData.empresa));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error(`Empresa ${userData.empresa} no encontrada`);
        }

        const empresaDoc = querySnapshot.docs[0];
        const empresaId = empresaDoc.id;

        const userCredential = await createUserWithEmailAndPassword(
          this.auth,
          userData.email,
          userData.password
        );

        const usersRef = collection(this.firestore, 'users');
        const userDocRef = doc(usersRef, userCredential.user.uid);

        await setDoc(userDocRef, {
          uid: userCredential.user.uid,
          email: userData.email,
          nombre: userData.nombre,
          empresaId: empresaId,
          rol: userData.rol,
          estado: 'activo',
          permisos: PERMISOS_POR_ROL[userData.rol] || [],
          createdAt: Timestamp.fromDate(new Date())
        });

        this.usuariosCreados.push({
          email: userData.email,
          password: userData.password,
          empresa: userData.empresa
        });
      }

      this.mensaje = `✅ Se crearon ${this.usuariosCreados.length} usuarios de prueba`;
      this.snackBar.open('Usuarios creados', 'Cerrar', { duration: 3000 });
    } catch (error: any) {
      this.mensaje = '❌ Error: ' + error.message;
      this.snackBar.open('Error: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.creando = false;
    }
  }
}
