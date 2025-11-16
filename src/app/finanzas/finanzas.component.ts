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
  descripcion = '';
  monto = 0;
  tipo: 'ingreso' | 'gasto' = 'ingreso';

  constructor(private finanzasService: FinanzasService) { }

  ngOnInit() {
    this.finanzasService.obtener().subscribe(data => {
      this.movimientos = data || [];
    });
  }

  async agregar() {
    if (!this.descripcion || this.monto <= 0) return;

    const nuevo: Transaccion = {
      id: uuid(),
      descripcion: this.descripcion,
      monto: this.monto,
      tipo: this.tipo,
      fecha: new Date().toISOString()
    };

    await this.finanzasService.agregar(nuevo);

    this.descripcion = '';
    this.monto = 0;
    this.tipo = 'ingreso';
  }

  async eliminar(id: string) {
    await this.finanzasService.eliminar(id);
  }

  totalIngresos(): number {
    return this.movimientos
      .filter(m => m.tipo === 'ingreso')
      .reduce((total, m) => total + m.monto, 0);
  }

  totalGastos(): number {
    return this.movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((total, m) => total + m.monto, 0);
  }

  balance(): number {
    return this.totalIngresos() - this.totalGastos();
  }
}
