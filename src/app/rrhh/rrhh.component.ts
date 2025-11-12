import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { VacacionesService } from '../services/vacaciones.service';
import { RrhhService, Empleado } from '../services/rrhh.service';
import { SesionService } from '../services/sesion.service';

import { KeyValue } from '@angular/common';

@Component({
  selector: 'app-rrhh',
  templateUrl: './rrhh.component.html',
  styleUrls: ['./rrhh.component.scss']
})
export class RrhhComponent implements OnInit {
  empleados: Empleado[] = [];
  planillas: any[] = [];
  aguinaldos: { [id: string]: number } = {};
  diasVacaciones: { [id: string]: any } = {};

  // Campos del formulario
  cedula = '';
  nombre = '';
  puesto = '';
  fechaIngreso = '';
  tipoPago: 'mensual' | 'diario' = 'mensual';
  salarioMensual = 0;
  salarioDiario = 0;
  tipoContrato: 'indefinido' | 'definido' = 'indefinido';
  fechaFinContrato = '';

  editando = false;
  idEditando: string | null = null;
  usuarioActivo: any;

  constructor(
    private vacacionesService: VacacionesService,
    private rrhhService: RrhhService,
    private sesionService: SesionService
  ) { }

  ngOnInit() {
    const userData = localStorage.getItem('usuarioActivo');
    if (userData) this.usuarioActivo = JSON.parse(userData);

    this.empleados = this.rrhhService.obtener();

    const planillasData = localStorage.getItem('planillas');
    if (planillasData) this.planillas = JSON.parse(planillasData);

    this.actualizarDiasVacaciones();
    this.calcularAguinaldos();
  }

  agregar() {
    if (!this.cedula || !this.nombre || !this.puesto || !this.fechaIngreso) return;

    const empresaId = this.usuarioActivo?.empresa?.id || this.usuarioActivo?.empresa || 'desconocida';

    // Validar si ya existe en la empresa
    const existe = this.empleados.some(
      e => e.cedula === this.cedula && e.empresaId === empresaId && e.id !== this.idEditando
    );
    if (existe) {
      alert('Ya existe un funcionario con esta cédula en esta empresa.');
      return;
    }

    if (this.editando && this.idEditando) {
      const i = this.empleados.findIndex(e => e.id === this.idEditando);
      if (i >= 0) {
        this.empleados[i] = {
          ...this.empleados[i],
          cedula: this.cedula,
          nombre: this.nombre,
          puesto: this.puesto,
          fechaIngreso: this.fechaIngreso,
          tipoPago: this.tipoPago,
          salarioMensual: this.tipoPago === 'mensual' ? this.salarioMensual : 0,
          salarioDiario: this.tipoPago === 'diario' ? this.salarioDiario : 0,
          tipoContrato: this.tipoContrato,
          fechaFinContrato: this.tipoContrato === 'definido' ? this.fechaFinContrato : ''
        };
        this.rrhhService.actualizar(this.empleados[i]);
      }
      this.editando = false;
      this.idEditando = null;
    } else {
      const empresaId = this.usuarioActivo?.empresa?.id || this.usuarioActivo?.empresa || 'desconocida';
      const empresaCedula = this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';

      const nuevo: Empleado = {
        id: uuid(),
        empresaId,
        empresaCedula,
        cedula: this.cedula,
        nombre: this.nombre,
        puesto: this.puesto,
        fechaIngreso: this.fechaIngreso,
        tipoPago: this.tipoPago,
        salarioMensual: this.tipoPago === 'mensual' ? this.salarioMensual : 0,
        salarioDiario: this.tipoPago === 'diario' ? this.salarioDiario : 0,
        tipoContrato: this.tipoContrato,
        fechaFinContrato: this.tipoContrato === 'definido' ? this.fechaFinContrato : ''
      };
      this.rrhhService.agregar(nuevo);
      this.empleados.push(nuevo);
    }

    this.limpiarFormulario();
    this.actualizarDiasVacaciones();
    this.calcularAguinaldos();
  }

  eliminar(id: string) {
    const empleado = this.empleados.find(e => e.id === id);
    const nombre = empleado ? empleado.nombre : 'este empleado';
    if (!confirm(`¿Seguro que deseas eliminar a ${nombre}?`)) return;

    this.rrhhService.eliminar(id);
    this.empleados = this.empleados.filter(e => e.id !== id);
    alert(`✅ ${nombre} ha sido eliminado correctamente.`);
  }

  limpiarFormulario() {
    this.cedula = '';
    this.nombre = '';
    this.puesto = '';
    this.fechaIngreso = '';
    this.tipoPago = 'mensual';
    this.salarioMensual = 0;
    this.salarioDiario = 0;
    this.tipoContrato = 'indefinido';
    this.fechaFinContrato = '';
    this.editando = false;
  }

  editar(e: Empleado) {
    this.editando = true;
    this.idEditando = e.id;
    this.cedula = e.cedula;
    this.nombre = e.nombre;
    this.puesto = e.puesto;
    this.fechaIngreso = e.fechaIngreso;
    this.tipoPago = e.tipoPago;
    this.salarioMensual = e.salarioMensual;
    this.salarioDiario = e.salarioDiario;
    this.tipoContrato = e.tipoContrato;
    this.fechaFinContrato = e.fechaFinContrato || '';
  }

  calcularAguinaldos() {
    const añoActual = new Date().getFullYear();
    this.aguinaldos = {};

    this.empleados.forEach(e => {
      let totalAnual = 0;
      this.planillas.forEach(p => {
        const mes = new Date(p.mes + '-01');
        if (mes.getFullYear() === añoActual) {
          const detalle = p.detalleEmpleados?.find((d: any) => d.id === e.id);
          if (detalle) totalAnual += detalle.salarioNeto;
        }
      });
      this.aguinaldos[e.id] = totalAnual / 12;
    });
  }

  actualizarDiasVacaciones() {
    this.empleados.forEach(e => {
      this.diasVacaciones[e.id] = this.vacacionesService.calcularDiasPendientes(e.id, e.fechaIngreso);
    });
  }

  tieneVacacionesPendientes(id: string): boolean {
    const vac = this.diasVacaciones[id];
    if (!vac) return false;
    return Object.values(vac).some((dias: any) => dias > 0);
  }

  vacacionKeyValueFn = (a: KeyValue<string, number>, b: KeyValue<string, number>): number => {
    return 0; // no importa el orden, solo lo usamos para tipar correctamente
  };

  puedeEliminar(): boolean {
    return this.usuarioActivo?.rol === 'Supervisor';
  }

  esAdmin(): boolean {
    return this.usuarioActivo?.rol === 'Administrador';
  }
}


