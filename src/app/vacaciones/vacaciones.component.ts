import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { VacacionesService, SolicitudVacaciones } from '../services/vacaciones.service';
import { RrhhService, Empleado } from '../services/rrhh.service';
import { take } from 'rxjs/operators';

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

    this.vacacionesService.calcularDiasPendientes(
      this.empleadoId,
      this.empleadoSeleccionado.fechaIngreso
    ).pipe(take(1))
      .subscribe(periodos => {

        const diasSolicitados = this.diasSolicitados;

        // Obtener total disponible
        const diasTotales: number = Object.values(periodos)
          .map(v => Number(v))
          .reduce((a, b) => a + b, 0);


        // ❌ Si solicita más de lo que tiene → error
        if (diasSolicitados > diasTotales) {
          alert(`El empleado solo tiene ${diasTotales} días disponibles.`);
          return;
        }

        let diasPorRegistrar = diasSolicitados;
        const solicitudesARegistrar: SolicitudVacaciones[] = [];

        let fechaCursor = new Date(this.fechaInicio);

        for (const periodo of Object.keys(periodos)) {
          if (diasPorRegistrar <= 0) break;

          const disponibles = Number(periodos[periodo]);

          if (disponibles > 0) {

            const usar = Math.min(disponibles, diasPorRegistrar);

            // Calcular fecha fin correcta según los días usados
            const fechaFinCalculada = this.sumarDias(fechaCursor, usar);

            solicitudesARegistrar.push({
              id: uuid(),
              empleadoId: this.empleadoId,
              fechaInicio: new Date(fechaCursor).toISOString().split('T')[0],
              fechaFin: fechaFinCalculada.toISOString().split('T')[0],
              diasSolicitados: usar,
              observacion: this.observacion,
              periodo: periodo
            });



            // Avanzar el cursor al día siguiente para el siguiente periodo
            fechaCursor = new Date(fechaFinCalculada);
            fechaCursor.setDate(fechaCursor.getDate() + 1);

            diasPorRegistrar -= usar;
          }
        }


        // ✔ Registrar cada una
        const promesas = solicitudesARegistrar.map(s =>
          this.vacacionesService.registrarSolicitud(s, this.empleadoSeleccionado)
        );

        Promise.all(promesas).then(() => {
          alert('Vacaciones registradas correctamente.');
          this.cargarSolicitudes();
          this.limpiar();
        });
      });
  }

  sumarDias(fecha: Date, dias: number): Date {
    const f = new Date(fecha);
    f.setDate(f.getDate() + dias - 1);
    return f;
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

