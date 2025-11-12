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

  constructor(private finanzasService: FinanzasService) { } // 👈 usamos el servicio

  ngOnInit() {
    this.movimientos = this.finanzasService.obtener();
  }

  guardar() {
    // 🔹 Actualiza el almacenamiento de la empresa activa
    localStorage.setItem(
      this.finanzasService['getStorageKey'](), // accedemos a la clave interna
      JSON.stringify(this.movimientos)
    );
  }

  agregar() {
    if (!this.descripcion || this.monto <= 0) return;

    const nuevo: Transaccion = {
      id: uuid(),
      descripcion: this.descripcion,
      monto: this.monto,
      tipo: this.tipo,
      fecha: new Date().toLocaleString()
    };

    this.finanzasService.agregar(nuevo);
    this.movimientos = this.finanzasService.obtener(); // refrescamos la lista

    this.descripcion = '';
    this.monto = 0;
    this.tipo = 'ingreso';
  }

  eliminar(id: string) {
    this.finanzasService.eliminar(id);
    this.movimientos = this.finanzasService.obtener();
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
