// src/app/services/sesion.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SesionService {
  getUsuarioActivo() {
    const data = localStorage.getItem('usuarioActivo');
    return data ? JSON.parse(data) : null;
  }

  getEmpresaActual() {
    const user = this.getUsuarioActivo();
    return user ? user.empresa : null;
  }

  getCedulaEmpresaActual() {
    const empresa = this.getEmpresaActual();
    if (empresa === 'Transportes D&F') return '3-102-908063';
    if (empresa === 'Transportes GyA') return '3-102-753174';
    return null;
  }
}
