import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { IncapacidadesService, Incapacidad } from '../services/incapacidades.service';

@Component({
  selector: 'app-incapacidades',
  templateUrl: './incapacidades.component.html',
  styleUrls: ['./incapacidades.component.scss']
})
export class IncapacidadesComponent implements OnInit {
  incapacidades: Incapacidad[] = [];
  empleados: any[] = [];

  empleadoId = '';
  fechaInicio = '';
  fechaFin = '';
  mesActual: string = '';
  mostrarInfo = false;
  tipo: 'enfermedad' | 'accidente' | 'maternidad' | 'permisosg' | '' = '';

  usuarioActivo: any;

  constructor(private incapacidadesService: IncapacidadesService) { }

  ngOnInit(): void {
    const userData = localStorage.getItem('usuarioActivo');
    if (userData) this.usuarioActivo = JSON.parse(userData);
    this.cargarIncapacidades();

    const empleadosData = localStorage.getItem('empleados');
    if (empleadosData) {
      const todos = JSON.parse(empleadosData);
      const empresaId = this.usuarioActivo?.empresa?.id || this.usuarioActivo?.empresa || 'desconocida';
      this.empleados = todos.filter((e: any) => e.empresaId === empresaId);
    }
  }

  calcularDias(): number {
    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return 0;
    return Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  guardarIncapacidad() {
    if (!this.empleadoId || !this.fechaInicio || !this.fechaFin || !this.tipo) {
      alert('Por favor completá todos los campos.');
      return;
    }

    const [year, month, day] = this.fechaInicio.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);
    const dias = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const nueva: Incapacidad = {
      id: uuid(),
      empleadoId: this.empleadoId,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      dias,
      mes,
      tipo: this.tipo
    };

    const existentes = this.incapacidadesService.obtener();
    existentes.push(nueva);
    this.incapacidadesService.guardar(existentes);

    this.cargarIncapacidades();
    alert('✅ Incapacidad registrada correctamente');
    this.limpiarCampos();
  }

  eliminar(id: string) {
    const confirmar = confirm('¿Seguro que desea eliminar esta incapacidad?');
    if (!confirmar) return;

    this.incapacidades = this.incapacidades.filter(i => i.id !== id);
    this.incapacidadesService.guardar(this.incapacidades);
  }

  obtenerNombreEmpleado(id: string): string {
    const emp = this.empleados.find(e => e.id === id);
    return emp ? emp.nombre : 'Empleado desconocido';
  }

  formatearMes(mes: string): string {
    if (!mes || typeof mes !== 'string' || !mes.includes('-')) {
      return 'Sin mes';
    }

    const [year, month] = mes.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[+month - 1]} ${year}`;
  }

  limpiarCampos() {
    this.empleadoId = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.tipo = '';
  }

  cargarIncapacidades() {
    this.incapacidades = this.incapacidadesService.obtener();
  }
}
