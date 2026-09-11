import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, orderBy, limit } from '@angular/fire/firestore';
import { SesionService } from '../services/sesion.service';

interface AuditoriaLog {
  id: string;
  usuarioNombre: string;
  modulo: string;
  accion: string;
  descripcion: string;
  fecha: Date;
  hora: string;
  idElemento: string;
}

@Component({
  selector: 'app-reporteria',
  templateUrl: './reporteria.component.html',
  styleUrls: ['./reporteria.component.scss']
})
export class ReporteriaComponent implements OnInit {

  usuarioActivo: any;
  logs: AuditoriaLog[] = [];
  filtroModulo = '';
  filtroAccion = '';
  filtroFecha: { inicio: Date | null; fin: Date | null } = { inicio: null, fin: null };

  modulos = ['rrhh', 'planilla', 'finanzas', 'vacaciones', 'incapacidades', 'configuracion'];
  acciones = ['crear', 'editar', 'eliminar', 'ver'];

  estadisticas = {
    totalAcciones: 0,
    accionesPorModulo: {} as { [key: string]: number },
    accionesPorTipo: {} as { [key: string]: number },
    usuariosMasActivos: [] as { nombre: string; cantidad: number }[]
  };

  constructor(
    private firestore: Firestore,
    private sesionService: SesionService
  ) {}

  ngOnInit() {
    this.usuarioActivo = this.sesionService.getUsuarioActivo();
    this.cargarLogs();
  }

  async cargarLogs() {
    try {
      const empresa = await this.sesionService.obtenerEmpresaActual();
      if (!(empresa as any)?.id) return;

      const auditoriaRef = collection(this.firestore, 'auditoria');
      const q = query(
        auditoriaRef,
        where('empresaId', '==', (empresa as any).id),
        orderBy('fecha', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(q);
      this.logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditoriaLog));

      this.generarEstadisticas();
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  }

  generarEstadisticas() {
    this.estadisticas.totalAcciones = this.logs.length;
    this.estadisticas.accionesPorModulo = {};
    this.estadisticas.accionesPorTipo = {};

    const usuariosActivos = {} as { [key: string]: number };

    this.logs.forEach(log => {
      this.estadisticas.accionesPorModulo[log.modulo] =
        (this.estadisticas.accionesPorModulo[log.modulo] || 0) + 1;

      this.estadisticas.accionesPorTipo[log.accion] =
        (this.estadisticas.accionesPorTipo[log.accion] || 0) + 1;

      usuariosActivos[log.usuarioNombre] = (usuariosActivos[log.usuarioNombre] || 0) + 1;
    });

    this.estadisticas.usuariosMasActivos = Object.entries(usuariosActivos)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  aplicarFiltros() {
    this.cargarLogs();
  }

  limpiarFiltros() {
    this.filtroModulo = '';
    this.filtroAccion = '';
    this.filtroFecha = { inicio: null, fin: null };
    this.cargarLogs();
  }

  obtenerLogsFiltrados(): AuditoriaLog[] {
    return this.logs.filter(log => {
      if (this.filtroModulo && log.modulo !== this.filtroModulo) return false;
      if (this.filtroAccion && log.accion !== this.filtroAccion) return false;
      return true;
    });
  }

  exportarCSV() {
    const logsParaExportar = this.obtenerLogsFiltrados();
    let csv = 'Usuario,Módulo,Acción,Descripción,Fecha,Hora\n';

    logsParaExportar.forEach(log => {
      csv += `"${log.usuarioNombre}","${log.modulo}","${log.accion}","${log.descripcion}","${this.formatearFecha(log.fecha)}","${log.hora}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporteria-auditoria-${new Date().toISOString()}.csv`;
    a.click();
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CR');
  }
}
