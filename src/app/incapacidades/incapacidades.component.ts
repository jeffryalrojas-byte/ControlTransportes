import { Component, OnInit } from '@angular/core';
import { IncapacidadesService, Incapacidad } from '../services/incapacidades.service';
import { RrhhService } from '../services/rrhh.service';
import { v4 as uuid } from 'uuid';
import { PlanillasService } from '../services/planillas.service';

@Component({
  selector: 'app-incapacidades',
  templateUrl: './incapacidades.component.html',
  styleUrls: ['./incapacidades.component.scss']
})
export class IncapacidadesComponent implements OnInit {

  empleados: any[] = [];
  incapacidades: Incapacidad[] = [];

  empleadoId = '';
  fechaInicio = '';
  fechaFin = '';
  tipo: '' | 'enfermedad' | 'accidente' | 'maternidad' | 'permisosg' | 'paternidad' = '';
  numIncapacidad: string = '';

  empleadoSeleccionado: any = null;
  mostrarInfo: boolean = false;

  constructor(
    private incapacidadesService: IncapacidadesService,
    private rrhhService: RrhhService,
    private planillasService: PlanillasService
  ) { }

  ngOnInit() {
    // 🔥 Cargar empleados desde Firebase como vacaciones
    this.rrhhService.obtener().subscribe(data => {
      this.empleados = data;
    });
  }

  seleccionarEmpleado(id: string) {
    this.empleadoSeleccionado = this.empleados.find(e => e.id === id) || null;

    this.incapacidadesService.obtenerPorEmpleado(id).subscribe(list => {
      this.incapacidades = list;
    });
  }

  calcularDias(): number {
    const inicio = new Date(`${this.fechaInicio}T00:00:00`);
    const fin = new Date(`${this.fechaFin}T00:00:00`);


    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;

    // Si es paternidad → NO contar sábados ni domingos
    if (this.tipo === 'paternidad') {
      let count = 0;

      let current = new Date(inicio);
      let end = new Date(fin);

      // Normalizar horas
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      while (current <= end) {
        const day = current.getDay(); // 0 domingo - 6 sábado
        if (day !== 0 && day !== 6) {
          count++;
        }

        current.setDate(current.getDate() + 1);
      }

      return count;
    }


    // Para los demás tipos → cálculo normal
    return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }


  guardarIncapacidad() {

    if (!this.empleadoId || !this.fechaInicio || !this.fechaFin || !this.tipo || !this.numIncapacidad) {
      alert('🚫 Por favor completá todos los campos.');
      return;
    }

    // 📌 Obtener el mes de la incapacidad
    const inicio = new Date(`${this.fechaInicio}T00:00:00`);
    const mes = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`;

    // 🔥 PRIMER PASO → verificar si la planilla ya está cerrada
    this.planillasService.existePlanillaMes(mes).subscribe(planillas => {

      if (planillas.length > 0) {
        // ❌ Ya existe planilla
        alert(`🚫 No se puede registrar la incapacidad.\nLa planilla del mes ${mes} ya fue presentada.\n\n➡️ Debe eliminar la planilla primero.`);
        return;
      }

      // ===============================
      //   SI NO HAY PLANILLA → GUARDAR
      // 

      // 🔥 Si es PATERNIDAD → NO dividir por mes
      if (this.tipo === 'paternidad') {

        const inicio = new Date(`${this.fechaInicio}T00:00:00`);
        const mes = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`;

        const incapacidad: Incapacidad = {
          id: uuid(),
          empleadoId: this.empleadoId,
          fechaInicio: this.fechaInicio,
          fechaFin: this.fechaFin,
          dias: this.calcularDias(), // tu método original
          mes,
          tipo: this.tipo,
          numIncapacidad: this.numIncapacidad
        };

        this.incapacidadesService.guardar(incapacidad);
        alert('✅ Incapacidad registrada correctamente');
        this.limpiar();
        return;
      }

      // 🔥 PARA TODO LO DEMÁS → DIVIDIR ENTRE MESES
      const rangos = this.dividirPorMes(this.fechaInicio, this.fechaFin);

      rangos.forEach(r => {
        const year = r.inicio.getFullYear();
        const month = String(r.inicio.getMonth() + 1).padStart(2, '0');

        const incapacidad: Incapacidad = {
          id: uuid(),
          empleadoId: this.empleadoId,
          fechaInicio: r.inicio.toISOString().substring(0, 10),
          fechaFin: r.fin.toISOString().substring(0, 10),
          dias: this.calcularDiasMes(r.inicio, r.fin),
          mes: `${year}-${month}`,
          tipo: this.tipo as Incapacidad['tipo'],
          numIncapacidad: this.numIncapacidad
        };

        this.incapacidadesService.guardar(incapacidad);
      });

      alert('✅ Incapacidad registrada por mes correctamente');
      this.limpiar();
    });
  }


  eliminar(id: string) {
    if (!confirm('¿Seguro que deseás eliminar esta incapacidad?')) return;

    this.incapacidadesService.eliminar(id);
  }

  limpiar() {
    this.empleadoId = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.tipo = '';
    this.empleadoSeleccionado = null;
    this.incapacidades = [];
  }

  formatearMes(mes: string): string {
    if (!mes) return '';

    // Si el mes viene como "2025-10" o "2025-03"
    if (mes.includes('-')) {
      const [year, month] = mes.split('-');
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${nombresMeses[+month - 1]} ${year}`;
    }

    // Si viene como "Octubre 2025" o similar, solo lo devuelve igual
    return mes;
  }

  private dividirPorMes(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);

    const rangos: { inicio: Date; fin: Date }[] = [];
    let actual = new Date(inicio);

    while (actual <= fin) {
      const ultimoDiaMes = new Date(actual.getFullYear(), actual.getMonth() + 1, 0);

      const finRango = new Date(Math.min(ultimoDiaMes.getTime(), fin.getTime()));

      rangos.push({
        inicio: new Date(actual),
        fin: finRango
      });

      actual = new Date(finRango);
      actual.setDate(actual.getDate() + 1);
    }

    return rangos;
  }

  private calcularDiasMes(inicio: Date, fin: Date): number {
    inicio = new Date(inicio);
    fin = new Date(fin);

    return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }



}
