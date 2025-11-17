import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { FinanzasService, Transaccion } from '../services/finanzas.service';

@Component({
  selector: 'app-finanzas',
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss']
})

export class FinanzasComponent implements OnInit {

  movimientos: Transaccion[] = [];
  movimientosFiltrados: Transaccion[] = [];

  descripcion = '';
  monto = 0;
  tipo: 'ingreso' | 'gasto' = 'ingreso';
  mesActivo: string = new Date().toISOString().slice(0, 7); // YYYY-MM

  constructor(private finanzasService: FinanzasService) { }

  ngOnInit() {
    // Cargar todos
    this.finanzasService.obtener().subscribe(data => {
      this.movimientos = data || [];
      this.filtrarPorMes();
    });
  }

  filtrarPorMes() {
    if (!this.mesActivo) {
      this.movimientosFiltrados = [];
      return;
    }

    this.movimientosFiltrados = this.movimientos.filter(m =>
      m.mes === this.mesActivo
    );
  }

  async agregar() {
    if (!this.descripcion || this.monto <= 0) return;

    if (!this.mesActivo) {
      alert("⚠️ Primero seleccione el mes en el que desea registrar el movimiento.");
      return;
    }

    const nuevo: Transaccion = {
      id: uuid(),
      descripcion: this.descripcion,
      monto: this.monto,
      tipo: this.tipo,
      fecha: new Date().toISOString(),
      mes: this.mesActivo  // 🔥 GUARDAMOS EL MES SELECCIONADO
    };

    await this.finanzasService.agregar(nuevo);

    this.descripcion = '';
    this.monto = 0;
    this.tipo = 'ingreso';
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

}

