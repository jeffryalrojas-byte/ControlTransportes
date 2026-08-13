/**
 * 🔄 MIGRACIÓN COMPLETA DE DATOS
 */

import { Component } from '@angular/core';
import { Firestore, collection, getDocs, doc, setDoc } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-migracion-completa',
  template: `
    <div style="padding: 40px; max-width: 1000px; margin: 0 auto;">
      <h2>🔄 Migración Completa de Datos</h2>
      <p style="color: #999; margin-bottom: 20px;">
        Migra TODOS los datos (empleados, planillas, vacaciones, etc.) de empresas antiguas a nuevas.
      </p>

      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <strong>⚠️ ADVERTENCIA:</strong> Verifica que las nuevas empresas existan antes de proceder.
      </div>

      <button 
        (click)="migrarTodo()"
        [disabled]="migrando"
        style="padding: 12px 24px; font-size: 16px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;"
      >
        {{ migrando ? 'Migrando...' : 'Iniciar Migración Completa' }}
      </button>

      <div *ngIf="progreso" style="margin-top: 20px;">
        <p><strong>Estado:</strong> {{ progreso }}</p>
      </div>

      <div *ngIf="resumen" style="margin-top: 30px; background: #e8f5e9; padding: 20px; border-radius: 8px;">
        <h3>✅ Migración Completada</h3>
        <p><strong>Total registros migrados:</strong> {{ resumen.total }}</p>
        <p *ngIf="resumen.mensaje">{{ resumen.mensaje }}</p>
      </div>
    </div>
  `
})
export class MigracionCompletaComponent {
  migrando = false;
  progreso = '';
  resumen: any = null;

  mapeoEmpresas = [
    { cedulaAntigua: '3-102-908063', nombreEmpresa: 'Transportes D&F' },
    { cedulaAntigua: '3-102-753174', nombreEmpresa: 'Transportes GyA' }
  ];

  colecciones = ['empleados', 'planillas', 'vacaciones', 'incapacidades', 'finanzas', 'configuracion'];

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar
  ) { }

  async migrarTodo(): Promise<void> {
    if (this.migrando) return;

    this.migrando = true;
    this.progreso = '⏳ Iniciando migración...';
    let totalRegistros = 0;

    try {
      // Obtener IDs de las nuevas empresas
      const empresasRef = collection(this.firestore, 'empresas');
      const empresasSnap = await getDocs(empresasRef);
      
      const nuevosMapeosIds: {[key: string]: string} = {};
      empresasSnap.forEach(doc => {
        const data = doc.data();
        for (const mapeo of this.mapeoEmpresas) {
          if (data['nombre'] === mapeo.nombreEmpresa) {
            nuevosMapeosIds[mapeo.cedulaAntigua] = doc.id;
          }
        }
      });

      // Migrar cada empresa
      for (const mapeo of this.mapeoEmpresas) {
        const empresaIdNueva = nuevosMapeosIds[mapeo.cedulaAntigua];
        if (!empresaIdNueva) {
          throw new Error(`No se encontró empresa ${mapeo.nombreEmpresa}`);
        }

        this.progreso = `⏳ Migrando ${mapeo.nombreEmpresa}...`;

        // Migrar cada colección
        for (const coleccion of this.colecciones) {
          try {
            const coleccionAntiguaRef = collection(
              this.firestore,
              `empresas/${mapeo.cedulaAntigua}/${coleccion}`
            );

            const docsAntiguos = await getDocs(coleccionAntiguaRef);

            for (const docAntigo of docsAntiguos.docs) {
              const datos = docAntigo.data();

              if (datos['empresaId']) {
                datos['empresaId'] = empresaIdNueva;
              }

              const docNuevoRef = doc(
                this.firestore,
                `empresas/${empresaIdNueva}/${coleccion}/${docAntigo.id}`
              );

              await setDoc(docNuevoRef, datos);
              totalRegistros++;
            }
          } catch (e) {
            console.warn(`Advertencia en ${coleccion}:`, e);
          }
        }
      }

      this.resumen = {
        total: totalRegistros,
        mensaje: `Se migraron correctamente ${totalRegistros} registros de todas las colecciones.`
      };
      this.progreso = '';
      this.snackBar.open('Migración completada', 'Cerrar', { duration: 3000 });
    } catch (error: any) {
      this.progreso = '❌ Error: ' + error.message;
      this.snackBar.open('Error: ' + error.message, 'Cerrar', { duration: 5000 });
    } finally {
      this.migrando = false;
    }
  }
}
