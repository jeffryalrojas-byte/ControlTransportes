import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { VacacionesService, SolicitudVacaciones } from '../services/vacaciones.service';
import { RrhhService, Empleado } from '../services/rrhh.service';

@Component({
  selector: 'app-vacaciones',
  templateUrl: './vacaciones.component.html',
  styleUrls: ['./vacaciones.component.scss']
})
export class VacacionesComponent implements OnInit {

  empleados: Empleado[] = [];
  solicitudes: SolicitudVacaciones[] = [];

  empleadoId = '';
  fechaInicio = '';
  fechaFin = '';
  diasSolicitados = 0;
  observacion = '';

  empleadoSeleccionado: Empleado | null = null;

  constructor(
    private vacacionesService: VacacionesService,
    private rrhhService: RrhhService
  ) { }

  ngOnInit() {
    // 🔥 Cargar empleados desde Firebase
    this.rrhhService.obtener().subscribe(data => {
      this.empleados = data;
    });
  }

  cargarSolicitudes() {
    if (!this.empleadoId) return;

    this.vacacionesService
      .obtenerSolicitudesEmpleado(this.empleadoId)
      .subscribe(list => {
        this.solicitudes = list;
      });
  }

  seleccionarEmpleado(id: string) {
    this.empleadoSeleccionado = this.empleados.find(e => e.id === id) || null;
    this.cargarSolicitudes();
  }

  registrar() {
    if (!this.empleadoSeleccionado) {
      alert('Seleccione un empleado');
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

    this.vacacionesService
      .registrarSolicitud(nueva, this.empleadoSeleccionado)
      .then(() => {
        alert('Solicitud registrada');
        this.cargarSolicitudes();
        this.limpiar();
      });
  }

  limpiar() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.diasSolicitados = 0;
    this.observacion = '';
  }

  eliminarSolicitud(id: string) {
    if (confirm('¿Eliminar solicitud?')) {
      this.vacacionesService.eliminarSolicitud(id).then(() => {
        this.cargarSolicitudes();
      });
    }
  }
}

