import { Component, OnInit } from '@angular/core';
import { ConfiguracionService } from '../services/configuracion.service';
import { SesionService } from '../services/sesion.service';
import { IncapacidadesService } from '../services/incapacidades.service';

interface Empleado {
  id: number;
  nombre: string;
  puesto: string;
  tipoPago: 'mensual' | 'diario';
  salarioBase: number;
  dias?: number;
}

interface Planilla {
  mes: string;
  fechaCreacion: string;
  totalNeto: number;
  totalCargas: number;
  detalleEmpleados: { id: number; salarioNeto: number }[];
  cedulaEmpresa: string; // 🔹 NUEVO: identifica a qué empresa pertenece la planilla
}

@Component({
  selector: 'app-planilla',
  templateUrl: './planilla.component.html',
  styleUrls: ['./planilla.component.scss']
})
export class PlanillaComponent implements OnInit {
  empleados: Empleado[] = [];
  diasTrabajados: { [id: number]: number } = {};
  planillas: Planilla[] = [];
  incapacidades: any[] = [];

  ccssTrabajador = 0.0967;
  ccssPatrono = 0.1467;

  mesActual = '';
  totalNeto = 0;
  totalCargas = 0;

  cedulaEmpresaActual: string | null = null; // 🔹 para filtrar y guardar según empresa

  constructor(
    private configuracionService: ConfiguracionService,
    private sesionService: SesionService,
    private incapacidadesService: IncapacidadesService
  ) { }

  ngOnInit() {
    this.medirEspacioLocalStorage();

    // 🔹 Obtener empresa activa
    this.cedulaEmpresaActual = this.sesionService.getCedulaEmpresaActual();
    if (!this.cedulaEmpresaActual) {
      alert('⚠️ No se encontró una empresa activa. Inicia sesión nuevamente.');
      return;
    }

    const cargas = this.configuracionService.obtenerCargas();
    this.ccssTrabajador = cargas.ccssTrabajador;
    this.ccssPatrono = cargas.ccssPatrono;

    const empleadosData = localStorage.getItem('empleados');
    const planillasData = localStorage.getItem('planillas');

    if (empleadosData) {
      const parsed = JSON.parse(empleadosData);

      // 🔹 Filtrar empleados de la empresa actual
      const empleadosEmpresa = parsed.filter((e: any) => e.empresaCedula === this.cedulaEmpresaActual);

      this.empleados = empleadosEmpresa.map((e: any) => ({
        id: e.id,
        nombre: e.nombre,
        puesto: e.puesto,
        tipoPago: e.tipoPago,
        salarioBase: e.tipoPago === 'mensual'
          ? e.salarioMensual || e.salarioBase
          : e.salarioDiario || e.salarioBase,
        dias: e.dias || 0
      }));



      //Cargar incapacidades 
      const incapacidadesData = localStorage.getItem('incapacidades');
      if (incapacidadesData) this.incapacidades = JSON.parse(incapacidadesData);
    }

    // 🔹 Filtrar planillas por empresa activa
    if (planillasData) {
      const todas = JSON.parse(planillasData);
      this.planillas = todas.filter((p: Planilla) => p.cedulaEmpresa === this.cedulaEmpresaActual);
    }

    this.empleados.forEach(e => {
      this.diasTrabajados[e.id] = e.dias || 0;
    });

    this.calcularTotales();
  }

  salarioBruto(e: Empleado): number {
    const montoPorDia = e.tipoPago === 'mensual' ? e.salarioBase / 30 : e.salarioBase;
    const diasTrab = e.tipoPago === 'mensual' ? 30 : (this.diasTrabajados[e.id] || 0);
    let bruto = diasTrab * montoPorDia;

    if (!this.mesActual) return bruto;

    const incapacidadesMes = this.incapacidades.filter(i => {
      if (i.empleadoId !== e.id) return false;
      const mesIncapacidad = i.mes?.slice(0, 7);
      const mesPlanilla = this.mesActual?.slice(0, 7);
      return mesIncapacidad === mesPlanilla;
    });

    let rebajo = 0;
    incapacidadesMes.forEach(i => {
      const dias = i.dias;
      const tipo = i.tipo.toLowerCase();

      if (tipo === 'maternidad' || tipo === 'accidente' || tipo === 'permisosg') {
        rebajo += dias * montoPorDia;
        return;
      }

      if (tipo === 'enfermedad') {
        const diasPagados50 = Math.min(dias, 3);
        const diasNoPagados = Math.max(dias - 3, 0);
        const totalPagadoIncapacidad = diasPagados50 * (montoPorDia * 0.5);
        const totalNormal = dias * montoPorDia;
        rebajo += totalNormal - totalPagadoIncapacidad;
      }
    });

    return Math.max(bruto - rebajo, 0);
  }

  rebajosTrabajador(e: Empleado): number {
    if (e.tipoPago === 'diario') return 0;
    const bruto = this.salarioBruto(e);
    return bruto * this.ccssTrabajador;
  }

  salarioNeto(e: Empleado): number {
    const bruto = this.salarioBruto(e);
    if (e.tipoPago === 'diario') return bruto;
    return bruto - this.rebajosTrabajador(e);
  }

  cargaPatronal(e: Empleado): number {
    const bruto = this.salarioBruto(e);
    if (e.tipoPago === 'diario') return 0;
    return bruto * this.ccssPatrono;
  }

  actualizarDias(id: number, event: any) {
    const valor = Number(event.target.value) || 0;
    this.diasTrabajados[id] = valor;
    const empleado = this.empleados.find(e => e.id === id);
    if (empleado) empleado.dias = valor;
    this.calcularTotales();
  }

  calcularTotales() {
    this.totalNeto = this.empleados.reduce((sum, e) => sum + this.salarioNeto(e), 0);
    this.totalCargas = this.empleados.reduce((sum, e) => sum + this.cargaPatronal(e), 0);
  }

  guardarPlanilla() {
    if (!this.mesActual) {
      alert('Por favor selecciona un mes para guardar la planilla.');
      return;
    }

    if (!this.cedulaEmpresaActual) {
      alert('No se puede guardar planilla sin una empresa activa.');
      return;
    }

    this.calcularTotales();

    const nuevaPlanilla: Planilla = {
      mes: this.mesActual,
      fechaCreacion: new Date().toLocaleString(),
      totalNeto: this.totalNeto,
      totalCargas: this.totalCargas,
      detalleEmpleados: this.empleados.map(e => ({
        id: e.id,
        salarioNeto: this.salarioNeto(e)
      })),
      cedulaEmpresa: this.cedulaEmpresaActual // 🔹 Guardamos la empresa
    };

    // 🔹 Cargar todas las planillas y actualizar
    const todasPlanillas = JSON.parse(localStorage.getItem('planillas') || '[]');
    todasPlanillas.push(nuevaPlanilla);
    localStorage.setItem('planillas', JSON.stringify(todasPlanillas));

    // 🔹 Actualizamos solo las visibles de la empresa activa
    this.planillas = todasPlanillas.filter((p: Planilla) => p.cedulaEmpresa === this.cedulaEmpresaActual);

    alert(`✅ Planilla del mes ${this.mesActual} guardada con éxito para la empresa ${this.cedulaEmpresaActual}.`);
    this.mesActual = '';
  }

  eliminarPlanilla(index: number) {
    const confirmar = confirm(`¿Estás seguro que deseas eliminar la planilla de ${this.planillas[index].mes}?`);
    if (!confirmar) return;

    const planillasData = JSON.parse(localStorage.getItem('planillas') || '[]');

    // 🔹 Filtramos todas las planillas excepto la eliminada
    const restantes = planillasData.filter(
      (p: Planilla, i: number) =>
        !(p.cedulaEmpresa === this.cedulaEmpresaActual && i === index)
    );

    localStorage.setItem('planillas', JSON.stringify(restantes));

    // 🔹 Actualizamos lista local
    this.planillas = restantes.filter((p: Planilla) => p.cedulaEmpresa === this.cedulaEmpresaActual);
    this.calcularTotales();
  }

  medirEspacioLocalStorage() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) total += key.length + value.length;
      }
    }
    const totalKB = total / 1024;
    const totalMB = totalKB / 1024;
    console.log(`LocalStorage: ${total} bytes (~${totalKB.toFixed(2)} KB, ${totalMB.toFixed(3)} MB)`);
  }

  onMesChange() {
    this.incapacidades = this.incapacidadesService.obtener();
    this.calcularTotales();
  }


}

