import { Injectable } from '@angular/core';
import { SesionService } from '../services/sesion.service'; // 👈 importamos el servicio de sesión

export interface Transaccion {
  id: string;
  tipo: 'ingreso' | 'gasto';
  descripcion: string;
  monto: number;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private key = 'finanzas_data';

  constructor(private sesionService: SesionService) { } // 👈 inyección del servicio de sesión

  /** 🔹 Devuelve una clave única por empresa (ej: finanzas_data_3-102-908063) */
  private getStorageKey(): string {
    const cedula = this.sesionService.getCedulaEmpresaActual();
    return cedula ? `${this.key}_${cedula}` : this.key;
  }

  obtener(): Transaccion[] {
    return JSON.parse(localStorage.getItem(this.getStorageKey()) || '[]');
  }

  agregar(t: Transaccion) {
    const lista = this.obtener();
    lista.push(t);
    localStorage.setItem(this.getStorageKey(), JSON.stringify(lista));
  }

  eliminar(id: string) {
    const lista = this.obtener().filter(t => t.id !== id);
    localStorage.setItem(this.getStorageKey(), JSON.stringify(lista));
  }

  balance() {
    return this.obtener().reduce((acc, t) =>
      t.tipo === 'ingreso' ? acc + t.monto : acc - t.monto, 0);
  }
}

