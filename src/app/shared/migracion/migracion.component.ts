import { Component, OnInit } from '@angular/core';
import { Firestore, collection, addDoc, Timestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * COMPONENTE DE MIGRACIÓN - SOLO PARA DESARROLLO
 * 
 * Este componente migra las empresas hardcodeadas a Firestore.
 * Ejecutar UNA SOLA VEZ y luego eliminar.
 * 
 * Para usarlo:
 * 1. Agregar ruta: { path: 'migracion', component: MigracionComponent }
 * 2. Navegar a http://localhost:4200/migracion
 * 3. Dar click en "Migrar Empresas"
 * 4. Verificar en Firestore Console
 * 5. Eliminar esta ruta y componente
 */

@Component({
  selector: 'app-migracion',
  template: `
    <div style="padding: 40px; text-align: center;">
      <h2>🔄 Migración de Empresas a Firebase</h2>
      <p style="color: #999; margin-bottom: 20px;">
        Esto solo se debe ejecutar UNA SOLA VEZ
      </p>
      
      <button 
        (click)="migrarEmpresas()"
        [disabled]="migrando"
        style="padding: 12px 24px; font-size: 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;"
      >
        {{ migrando ? 'Migrando...' : 'Migrar Empresas a Firestore' }}
      </button>
      
      <p *ngIf="mensaje" style="margin-top: 20px; font-weight: bold;">
        {{ mensaje }}
      </p>
    </div>
  `
})
export class MigracionComponent implements OnInit {
  migrando = false;
  mensaje = '';

  // Empresas hardcodeadas a migrar
  empresasLegacy = [
    { 
      nombre: 'Transportes D&F', 
      cedula: '3-102-908063',
      propietarioId: 'admin-legacy', // ID temporal para empresas heredadas
      plan: 'professional' as const
    },
    { 
      nombre: 'Transportes GyA', 
      cedula: '3-102-753174',
      propietarioId: 'admin-legacy',
      plan: 'professional' as const
    }
  ];

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
  }

  async migrarEmpresas(): Promise<void> {
    if (this.migrando) return;

    this.migrando = true;
    this.mensaje = '⏳ Migrando...';

    try {
      const empresasRef = collection(this.firestore, 'empresas');

      for (const empresa of this.empresasLegacy) {
        await addDoc(empresasRef, {
          nombre: empresa.nombre,
          cedula: empresa.cedula,
          propietarioId: empresa.propietarioId,
          plan: empresa.plan,
          estado: 'activa',
          empleadosCount: 0,
          usuariosCount: 0,
          almacenamientoUsado: 0,
          createdAt: Timestamp.fromDate(new Date()),
          suscripcion: {
            plan: empresa.plan,
            fechaInicio: Timestamp.fromDate(new Date()),
            fechaVencimiento: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
            metodoPago: 'tarjeta' as const,
            estado: 'activa' as const
          }
        });
      }

      this.mensaje = '✅ Migración completada exitosamente!';
      this.snackBar.open('Empresas migradas a Firebase', 'Cerrar', { duration: 3000 });
    } catch (error: any) {
      this.mensaje = '❌ Error en migración: ' + error.message;
      this.snackBar.open('Error: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.migrando = false;
    }
  }
}
