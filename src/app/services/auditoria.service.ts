import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { SesionService } from './sesion.service';

export interface AuditoriaLog {
  id?: string;
  empresaId: string;
  usuarioId: string;
  usuarioNombre: string;
  modulo: string;
  accion: 'crear' | 'editar' | 'eliminar' | 'ver';
  descripcion: string;
  idElemento: string;
  fecha: Date;
  hora: string;
  detalles?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {

  constructor(
    private firestore: Firestore,
    private sesionService: SesionService
  ) {}

  async registrarAccion(
    modulo: string,
    accion: 'crear' | 'editar' | 'eliminar' | 'ver',
    descripcion: string,
    idElemento: string,
    detalles?: any
  ): Promise<void> {
    try {
      const usuario = this.sesionService.getUsuarioActivo() as any;
      const empresa = await this.sesionService.obtenerEmpresaActual();
      const ahora = new Date();

      const log: AuditoriaLog = {
        empresaId: (empresa as any)?.id || '',
        usuarioId: usuario?.uid || usuario?.id || '',
        usuarioNombre: usuario?.nombre || 'Desconocido',
        modulo,
        accion,
        descripcion,
        idElemento,
        fecha: ahora,
        hora: ahora.toLocaleTimeString('es-CR'),
        detalles
      };

      await addDoc(collection(this.firestore, 'auditoria'), log);
    } catch (error) {
      console.error('Error registrando auditoría:', error);
    }
  }

  obtenerHistorial(empresaId: string) {
    return collection(this.firestore, 'auditoria');
  }
}
