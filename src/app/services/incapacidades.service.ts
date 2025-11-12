import { Injectable } from '@angular/core';
import { SesionService } from '../services/sesion.service';

export interface Incapacidad {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  mes: string;
  tipo: 'enfermedad' | 'accidente' | 'maternidad' | 'permisosg';
}

@Injectable({ providedIn: 'root' })
export class IncapacidadesService {
  private STORAGE_KEY_BASE = 'incapacidades';

  constructor(private sesionService: SesionService) { }

  /** 🔹 Obtiene la clave del localStorage según la empresa actual */
  private getStorageKey(): string {
    const cedula = this.sesionService.getCedulaEmpresaActual();
    return cedula ? `${this.STORAGE_KEY_BASE}_${cedula}` : this.STORAGE_KEY_BASE;
  }

  obtener(): Incapacidad[] {
    return JSON.parse(localStorage.getItem(this.getStorageKey()) || '[]');
  }

  guardar(lista: Incapacidad[]) {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(lista));
  }
}

