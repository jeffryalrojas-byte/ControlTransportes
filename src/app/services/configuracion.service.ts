import { Injectable } from '@angular/core';
import { SesionService } from '../services/sesion.service'; // 👈 importa tu nuevo servicio

export interface CargasSociales {
  ccssTrabajador: number;
  ccssPatrono: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private readonly STORAGE_KEY = 'cargasSociales';
  private readonly HISTORICO_KEY = 'historicoCargas';

  constructor(private sesionService: SesionService) { } // 👈 inyectamos el servicio de sesión

  /** 🔹 Devuelve un sufijo único por empresa (ej: cargasSociales_3-102-908063) */
  private getStorageKey(base: string): string {
    const cedula = this.sesionService.getCedulaEmpresaActual();
    return cedula ? `${base}_${cedula}` : base;
  }

  guardarCargas(cargas: CargasSociales): void {
    const storageKey = this.getStorageKey(this.STORAGE_KEY);
    const historicoKey = this.getStorageKey(this.HISTORICO_KEY);

    // 🔹 Guardar configuración actual
    localStorage.setItem(storageKey, JSON.stringify(cargas));

    // 🔹 Guardar histórico (sin perder los anteriores)
    const historico = this.obtenerHistorico();
    historico.push({
      ...cargas,
      fecha: new Date().toLocaleString()
    });
    localStorage.setItem(historicoKey, JSON.stringify(historico));
  }

  obtenerCargas(): CargasSociales {
    const storageKey = this.getStorageKey(this.STORAGE_KEY);
    const data = localStorage.getItem(storageKey);

    if (data) return JSON.parse(data);

    // Valores por defecto si no hay guardado nada
    return {
      ccssTrabajador: 0.0967,
      ccssPatrono: 0.1467
    };
  }

  obtenerHistorico(): { ccssTrabajador: number; ccssPatrono: number; fecha: string }[] {
    const historicoKey = this.getStorageKey(this.HISTORICO_KEY);
    const data = localStorage.getItem(historicoKey);
    return data ? JSON.parse(data) : [];
  }
}


