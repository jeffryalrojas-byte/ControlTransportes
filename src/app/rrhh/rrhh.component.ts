import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { VacacionesService } from '../services/vacaciones.service';
import { RrhhService, Empleado } from '../services/rrhh.service';
import { SesionService } from '../services/sesion.service';

import { KeyValue } from '@angular/common';
import { PlanillasService } from '../services/planillas.service';

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
    private sesionService: SesionService,
    private planillasService: PlanillasService
  ) { }

  ngOnInit() {
    const userData = localStorage.getItem('usuarioActivo');
    if (userData) this.usuarioActivo = JSON.parse(userData);

    this.rrhhService.obtener().subscribe(data => {
      this.empleados = data;
      this.actualizarDiasVacaciones();
    });
    this.planillasService.obtener().subscribe((data: any[]) => {
      this.planillas = data || [];
      // recalcular aguinaldos luego de que lleguen las planillas
      this.calcularAguinaldos();
    });
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
      this.rrhhService.agregar(nuevo).then(() => {
      });
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

    // seguridad: si no hay empleados o planillas, limpiamos y salimos
    if (!this.empleados?.length || !this.planillas?.length) {
      this.empleados.forEach(e => this.aguinaldos[String(e.id)] = 0);
      return;
    }

    this.empleados.forEach(e => {
      const empIdStr = String(e.id);
      let totalAnual = 0;

      this.planillas.forEach(p => {
        // seguridad: si p.mes no existe, saltar
        if (!p?.mes) return;

        // obtener year del mes guardado (soportamos 'YYYY-MM' o 'YYYY-MM-DD')
        let year = null;
        try {
          // si p.mes es '2025-03' o '2025-03-01'
          const mesIso = p.mes.length === 7 ? `${p.mes}-01` : p.mes;
          year = new Date(mesIso).getFullYear();
        } catch {
          return;
        }

        if (year === añoActual) {
          // buscar detalle por id convirtiendo ambos a string
          const detalle = (p.detalleEmpleados || []).find((d: any) => String(d.id) === empIdStr);
          if (detalle && typeof detalle.salarioNeto === 'number') {
            totalAnual += detalle.salarioNeto;
          }
        }
      });

      this.aguinaldos[empIdStr] = totalAnual / 12;
    });

  }


  actualizarDiasVacaciones() {
    this.empleados.forEach(e => {
      this.vacacionesService.calcularDiasPendientes(e.id, e.fechaIngreso)
        .subscribe(dias => {
          // usar el año actual como periodo
          const periodo = new Date().getFullYear().toString();

          this.diasVacaciones[e.id] = {
            [periodo]: dias
          };
        });
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


