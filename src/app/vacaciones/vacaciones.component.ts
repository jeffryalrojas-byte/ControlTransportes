import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { SolicitudVacaciones, VacacionesService } from '../services/vacaciones.service';

interface Empleado {
  id: string;
  cedula: string;
  nombre: string;
}

@Component({
  selector: 'app-vacaciones',
  templateUrl: './vacaciones.component.html',
  styleUrls: ['./vacaciones.component.scss']
})
export class VacacionesComponent implements OnInit {
  empleados: Empleado[] = [];

  empleadoId = '';
  fechaInicio = '';
  fechaFin = '';
  diasSolicitados = 0;
  observacion = '';

  solicitudes: SolicitudVacaciones[] = [];

  constructor(private vacacionesService: VacacionesService) { }

  ngOnInit() {
    const userData = localStorage.getItem('usuarioActivo');
    const usuario = userData ? JSON.parse(userData) : null;
    const empresaId = usuario?.empresa?.id || usuario?.empresa || 'desconocida';

    const data = localStorage.getItem('empleados');
    if (data) {
      const empleados = JSON.parse(data);
      this.empleados = empleados.filter((e: any) => e.empresaId === empresaId); // 🟢 solo empleados de la empresa
    }
  }

  registrar() {
    if (!this.empleadoId || !this.fechaInicio || !this.fechaFin || this.diasSolicitados <= 0) {
      alert('Complete todos los campos, incluyendo los días solicitados.');
      return;
    }

    const nueva: SolicitudVacaciones = {
      id: uuid(),
      empleadoId: this.empleadoId,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      diasSolicitados: this.diasSolicitados,
      observacion: this.observacion
    };

    this.vacacionesService.registrarSolicitud(nueva);
    this.cargarSolicitudes();
    alert('✅ Solicitud registrada correctamente');
    this.limpiar();
  }

  limpiar() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.diasSolicitados = 0;
    this.observacion = '';
  }

  cargarSolicitudes() {
    this.solicitudes = this.vacacionesService.obtenerSolicitudesEmpleado(this.empleadoId);
  }

  eliminarSolicitud(id: string) {
    if (confirm('¿Deseas eliminar esta solicitud?')) {
      this.vacacionesService.eliminarSolicitud(id);
      this.cargarSolicitudes();
    }
  }
}
