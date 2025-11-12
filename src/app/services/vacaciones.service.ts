import { Injectable } from '@angular/core';

export interface SolicitudVacaciones {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  observacion: string;
  periodo?: string;
  empresaId?: string; // 🟢 nueva propiedad
}

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {
  private readonly STORAGE_KEY = 'solicitudes_vacaciones';

  constructor() { }

  private guardarEnLocalStorage(solicitudes: SolicitudVacaciones[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(solicitudes));
  }

  private cargarDesdeLocalStorage(): SolicitudVacaciones[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private calcularPeriodo(fechaIngreso: Date, fechaSolicitud: Date): string {
    let inicioPeriodo = new Date(fechaIngreso);
    let finPeriodo = new Date(inicioPeriodo);
    finPeriodo.setFullYear(finPeriodo.getFullYear() + 1);

    while (fechaSolicitud >= finPeriodo) {
      inicioPeriodo = new Date(finPeriodo);
      finPeriodo.setFullYear(finPeriodo.getFullYear() + 1);
    }

    return `${inicioPeriodo.getFullYear()}-${finPeriodo.getFullYear()}`;
  }

  /** ➕ Registrar solicitud asociada a la empresa actual */
  registrarSolicitud(solicitud: SolicitudVacaciones) {
    const solicitudes = this.cargarDesdeLocalStorage();

    // 🟢 Obtener empresa actual desde usuarioActivo
    const userData = localStorage.getItem('usuarioActivo');
    const usuario = userData ? JSON.parse(userData) : null;
    const empresaId = usuario?.empresa?.id || usuario?.empresa || 'desconocida';

    // Buscar empleado para calcular el período
    const empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
    const empleado = empleados.find((e: any) => e.id === solicitud.empleadoId && e.empresaId === empresaId); // 🟢 filtra por empresa

    if (!empleado) {
      console.warn(`⚠️ No se encontró el empleado con ID ${solicitud.empleadoId} en la empresa ${empresaId}`);
      return;
    }

    const fechaIngreso = new Date(empleado.fechaIngreso);
    const fechaSolicitud = new Date(solicitud.fechaInicio);

    solicitud.periodo = this.calcularPeriodo(fechaIngreso, fechaSolicitud);
    solicitud.empresaId = empresaId; // 🟢 asignar empresa

    solicitudes.push(solicitud);
    this.guardarEnLocalStorage(solicitudes);
  }

  /** 🔍 Obtener solicitudes solo de la empresa actual */
  obtenerSolicitudesEmpresa(): SolicitudVacaciones[] {
    const userData = localStorage.getItem('usuarioActivo');
    const usuario = userData ? JSON.parse(userData) : null;
    const empresaId = usuario?.empresa?.id || usuario?.empresa || 'desconocida';

    return this.cargarDesdeLocalStorage().filter(s => s.empresaId === empresaId);
  }

  obtenerSolicitudesEmpleado(empleadoId: string): SolicitudVacaciones[] {
    const userData = localStorage.getItem('usuarioActivo');
    const usuario = userData ? JSON.parse(userData) : null;
    const empresaId = usuario?.empresa?.id || usuario?.empresa || 'desconocida';

    const solicitudes = this.cargarDesdeLocalStorage()
      .filter(s => s.empleadoId === empleadoId && s.empresaId === empresaId); // 🟢 filtra por empresa

    const empleados = JSON.parse(localStorage.getItem('empleados') || '[]');
    const empleado = empleados.find((e: any) => e.id === empleadoId && e.empresaId === empresaId);
    if (!empleado) return [];

    const fechaIngreso = new Date(empleado.fechaIngreso);

    return solicitudes.map(s => {
      const fechaSolicitud = new Date(s.fechaInicio);
      const periodo = this.calcularPeriodo(fechaIngreso, fechaSolicitud);
      return { ...s, periodo };
    });
  }

  eliminarSolicitud(id: string) {
    const solicitudes = this.cargarDesdeLocalStorage().filter(s => s.id !== id);
    this.guardarEnLocalStorage(solicitudes);
  }

  calcularDiasPendientes(empleadoId: string, fechaIngreso: string): Record<string, number> {
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);

    if (isNaN(ingreso.getTime())) {
      return { 'Fecha inválida': 0 };
    }

    const solicitudes = this.obtenerSolicitudesEmpleado(empleadoId);
    const periodos: Record<string, number> = {};

    let inicio = new Date(ingreso);
    let fin = new Date(inicio);
    fin.setFullYear(fin.getFullYear() + 1);

    while (inicio <= hoy) {
      const periodo = `${inicio.getFullYear()}-${fin.getFullYear()}`;
      const mesesTrabajados = Math.min(
        Math.max(
          Math.floor(
            (Math.min(hoy.getTime(), fin.getTime()) - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30)
          ), 0),
        12
      );
      const diasGanados = mesesTrabajados;
      const diasTomados = solicitudes
        .filter(s => s.periodo === periodo)
        .reduce((total, s) => total + s.diasSolicitados, 0);

      periodos[periodo] = Math.max(diasGanados - diasTomados, 0);

      inicio = new Date(fin);
      fin.setFullYear(fin.getFullYear() + 1);
    }

    return periodos;
  }
}
