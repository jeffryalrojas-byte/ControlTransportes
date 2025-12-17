import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { VacacionesService, SolicitudVacaciones } from '../services/vacaciones.service';
import { RrhhService, Empleado } from '../services/rrhh.service';
import { take } from 'rxjs/operators';
import { SesionService } from '../services/sesion.service';
import { PlanillasService } from '../services/planillas.service';

@Component({
  selector: 'app-vacaciones',
  templateUrl: './vacaciones.component.html',
  styleUrls: ['./vacaciones.component.scss']
})
export class VacacionesComponent implements OnInit {

  usuarioActivo: any;

  empleados: Empleado[] = [];
  solicitudes: SolicitudVacaciones[] = [];
  planillas: any[] = [];

  mostrarInfo: boolean = false;

  empleadoId = '';
  fechaInicio = '';
  fechaFin = '';
  diasSolicitados = 0;
  observacion = '';

  empleadoSeleccionado: Empleado | null = null;

  estadoBotones: boolean = false;

  constructor(
    private vacacionesService: VacacionesService,
    private rrhhService: RrhhService,
    private sesionService: SesionService,
    private planillasService: PlanillasService
  ) { }

  ngOnInit() {
    // Obtenemos el usuario desde el servicio
    this.usuarioActivo = this.sesionService.getUsuarioActivo();
    //Cargamos los empleados
    this.CargarEmpleados();

    //Cargamos las planillas
    this.CargarPlanillas();
  }


  public CargarEmpleados(): any {
    // 🔥 Cargar empleados desde Firebase
    this.rrhhService.obtener().subscribe(data => {
      this.empleados = data;
    });
  }

  public CargarPlanillas(): any {
    this.planillasService.obtener().subscribe((data: any[]) => {
      this.planillas = data || [];
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
    this.estadoBotones = false
    this.empleadoSeleccionado = this.empleados.find(e => e.id === id) || null;

    if (!this.empleadoSeleccionado) return;

    const estado = this.rrhhService.obtenerEstadoEmpleado(this.empleadoSeleccionado);

    // Aquí NO limpiamos al empleado, solo bloqueamos nuevas solicitudes
    if (estado === 'inactivo') {
      this.estadoBotones = true;
      alert('El empleado está INACTIVO. No puede solicitar vacaciones, pero se mostrarán sus solicitudes.');
    }

    // Ahora sí cargamos las solicitudes SIEMPRE
    this.cargarSolicitudes();
  }



  registrar() {
    if (!this.empleadoSeleccionado) {
      alert('Seleccione un empleado');
      return;
    }

    //Validamos que las vaciones esten dentro del rango del contrato
    if (this.empleadoSeleccionado.fechaFinContrato) {
      const finContrato = new Date(this.empleadoSeleccionado.fechaFinContrato);
      const inicioVac = new Date(this.fechaInicio);
      const finVac = new Date(this.fechaFin);

      // Si la fecha de vacaciones esta fuera del rango del contrato
      if (inicioVac > finContrato || finVac > finContrato) {
        alert('🚫 No puede registrar vacaciones en fechas en las que el empleado no tiene nombramiento activo.\n\nVerifique las fechas del contrato.');
        return;
      }
    }

    let obsDiasPendientes;

    if (this.empleadoSeleccionado.tipoPago === 'diario') {
      // 🔥 DIARIO → CON PLANILLAS
      obsDiasPendientes = this.vacacionesService.calcularDiasPendientes(
        this.empleadoSeleccionado,
        this.planillas
      );
    } else {
      // 🔥 MENSUAL → SIN PLANILLAS
      obsDiasPendientes = this.vacacionesService.calcularDiasPendientesSinPlanillas(
        this.empleadoSeleccionado
      );
    }

    //Esto es según el método que se necesita
    obsDiasPendientes
      .pipe(take(1))
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

  //Valida si puedo eliminar las vacaciones solicitadas, para que aparezca el botón
  puedeEliminar(vacaciones: any): boolean {

    if (this.usuarioActivo?.rol === 'Supervisor') {
      return false;
    } else {
      const fechaFin = new Date(vacaciones.fechaFin);
      const hoy = new Date();

      return fechaFin <= hoy;
    }
  }
}

