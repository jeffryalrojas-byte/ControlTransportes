import { Injectable } from '@angular/core';
import { SesionService } from './sesion.service';

export interface Empleado {
  id: string;
  empresaId: string; // 
  empresaCedula: string;
  cedula: string;
  nombre: string;
  puesto: string;
  fechaIngreso: string;
  tipoPago: 'mensual' | 'diario';
  salarioMensual: number;
  salarioDiario: number;
  tipoContrato: 'indefinido' | 'definido';
  fechaFinContrato?: string;
  vacacionesTomadas?: number;
  incapacidades?: number;
}

@Injectable({ providedIn: 'root' })
export class RrhhService {
  private key = 'empleados';


  constructor(private sesionService: SesionService) { }

  private obtenerEmpresaId(): string {
    const userData = localStorage.getItem('usuarioActivo');
    const usuario = userData ? JSON.parse(userData) : null;
    return usuario?.empresa?.id || usuario?.empresa || 'desconocida';
  }

  obtener(): Empleado[] {
    const empresaId = this.obtenerEmpresaId();
    const empresaCedula = this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';

    const lista = JSON.parse(localStorage.getItem(this.key) || '[]');
    return lista.filter(
      (e: Empleado) => e.empresaId === empresaId && e.empresaCedula === empresaCedula
    );
  }

  agregar(e: Empleado) {
    const lista = JSON.parse(localStorage.getItem(this.key) || '[]');
    lista.push(e);
    localStorage.setItem(this.key, JSON.stringify(lista));
  }

  actualizar(e: Empleado) {
    const lista = JSON.parse(localStorage.getItem(this.key) || '[]');
    const i = lista.findIndex((x: Empleado) => x.id === e.id);
    if (i >= 0) lista[i] = e;
    localStorage.setItem(this.key, JSON.stringify(lista));
  }

  eliminar(id: string) {
    const lista = JSON.parse(localStorage.getItem(this.key) || '[]');
    const nuevaLista = lista.filter((e: Empleado) => e.id !== id);
    localStorage.setItem(this.key, JSON.stringify(nuevaLista));
  }

  calcularAntiguedad(fechaIngreso: string): number {
    const ingreso = new Date(fechaIngreso);
    const hoy = new Date();
    return hoy.getFullYear() - ingreso.getFullYear();
  }

  calcularAguinaldo(e: Empleado, salarioMensual: number): number {
    return salarioMensual * (1 / 12);
  }
}
