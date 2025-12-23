import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { FinanzasService, Transaccion } from '../services/finanzas.service';
import { SesionService } from '../services/sesion.service';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss']
})

export class FinanzasComponent implements OnInit {

  movimientos: Transaccion[] = [];
  movimientosFiltrados: Transaccion[] = [];

  categoriaActiva: string | null = null;

  usuarioActivo: any;

  descripcion = '';
  monto = 0;
  tipo: 'ingreso' | 'gasto' = 'ingreso';
  mesActivo: string = new Date().toISOString().slice(0, 7); // YYYY-MM

  anioActivo: string = new Date().getFullYear().toString();

  aniosDisponibles: string[] = [];

  categorias: string[] = [
    "Pago de CCSS",
    "Combustible",
    "Contabilidad",
    "CANON CTP",
    "Seguros INS",
    "Marchamo",
    "Patente",
    "Impuesto Renta",
    "Impuesto Sociedad",
    "Salarios Choferes",
    "Mantenimiento",
    "Chofer comodín",
    "Planilla CCSS",
    "GPS",
    "Abogados",
    "Aguinaldo",
    "Otros Gastos",
    "Salarios dueños"
  ];

  categoriaSeleccionada = "";
  nuevaCategoria = "";

  constructor(private finanzasService: FinanzasService,
    private sesionService: SesionService
  ) { }

  ngOnInit() {

    // Obtenemos el usuario desde el servicio
    this.usuarioActivo = this.sesionService.getUsuarioActivo();

    // Cargar todos
    this.finanzasService.obtener().subscribe(data => {
      this.movimientos = data || [];
      this.filtrarPorMes();
      // Cargar años disponibles dinámicamente
      const añosSet = new Set(
        this.movimientos
          .filter(m => m.mes)
          .map(m => m.mes.substring(0, 4))
      );

      this.aniosDisponibles = Array.from(añosSet).sort();

    });
  }

  filtrarPorMes() {
    if (!this.mesActivo) {
      this.movimientosFiltrados = [];
      return;
    }

    // 🔥 BORRAR EL AÑO SELECCIONADO
    this.anioActivo = '';

    const filtrados = this.movimientos.filter(m =>
      m.mes === this.mesActivo
    );

    this.movimientosFiltrados = this.ordenarPorMesDesc(filtrados);
  }

  filtrarPorAnio() {
    if (!this.anioActivo) {
      this.movimientosFiltrados = [];
      return;
    }
    // 🔥 BORRAR EL MES SELECCIONADO
    this.mesActivo = '';

    const filtrados = this.movimientos.filter(m =>
      m.mes?.startsWith(this.anioActivo)
    );

    this.movimientosFiltrados = this.ordenarPorMesDesc(filtrados);
  }

  ordenarPorMesDesc(lista: Transaccion[]): Transaccion[] {
    return [...lista].sort((a, b) =>
      b.mes.localeCompare(a.mes)
    );
  }

  async agregar() {
    if (!this.descripcion || this.monto <= 0 || !this.categoriaSeleccionada) {
      alert("Debe completar descripción, monto y categoría.");
      return;
    }

    const nuevo: Transaccion = {
      id: uuid(),
      descripcion: this.descripcion,
      monto: this.monto,
      tipo: this.tipo,
      fecha: new Date().toISOString(),
      mes: this.mesActivo,
      categoria: this.categoriaSeleccionada   // ← AGREGADO
    };

    await this.finanzasService.agregar(nuevo);

    this.descripcion = '';
    this.monto = 0;
    this.tipo = 'ingreso';
    this.categoriaSeleccionada = '';

    this.filtrarPorMes();
  }


  async eliminar(id: string) {
    await this.finanzasService.eliminar(id);
    this.filtrarPorMes();
  }

  totalIngresos() {
    return this.movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  totalGastos() {
    return this.movimientosFiltrados
      .filter(m => m.tipo === 'gasto')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  balance() {
    return this.totalIngresos() - this.totalGastos();
  }

  totalIngresosGlobal() {
    return this.movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  totalGastosGlobal() {
    return this.movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((sum, m) => sum + m.monto, 0);
  }

  balanceGlobal() {
    return this.totalIngresosGlobal() - this.totalGastosGlobal();
  }

  puedeVisualizarGeneral(): boolean {
    return this.usuarioActivo?.rol === 'Supervisor';
  }

  agregarCategoria() {

    confirm(`En Costrucción actualmente....`);
    /* const c = this.nuevaCategoria.trim();

    if (!c) return;

    if (!this.categorias.includes(c)) {
      this.categorias.push(c);
    }

    this.nuevaCategoria = ""; */
  }


  filtrarPorCategoria(cat: string) {

    const filtrados = this.movimientos.filter(m => {

      // 🔹 Coincide categoría
      const mismaCategoria = m.categoria === cat;

      // 🔹 Coincide año
      const mismoAnio = this.anioActivo
        ? m.mes?.startsWith(this.anioActivo)
        : true;

      // 🔹 Coincide mes (solo si el usuario lo está usando)
      const mismoMes = this.mesActivo
        ? m.mes === this.mesActivo
        : true;

      return mismaCategoria && mismoAnio && mismoMes;
    });
    // 🔥 ORDENAR POR MES (YYYY-MM)
    this.movimientosFiltrados = this.ordenarPorMesDesc(filtrados);
  }


}

