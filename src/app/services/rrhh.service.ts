import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { SesionService } from './sesion.service';
import { v4 as uuid } from 'uuid';
import { map } from 'rxjs/operators';

export interface Empleado {
  id: string;
  empresaId: string;
  empresaCedula: string;
  cedula: string;
  nombre: string;
  puesto: string;
  fechaIngreso: string;
  tipoPago: 'mensual' | 'diario';
  salarioMensual: number;
  salarioDiario: number;
  tipoContrato: 'indefinido' | 'definido';
  fechaFinContrato?: string;
}

@Injectable({ providedIn: 'root' })
export class RrhhService {

  constructor(
    private afs: AngularFirestore,
    private sesionService: SesionService
  ) { }

  private obtenerEmpresaCedula() {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  // ===========================
  // 📌 OBTENER EMPLEADOS
  // ===========================
  obtener() {
    const cedulaEmpresa = this.obtenerEmpresaCedula();

    return this.afs
      .collection(`empresas/${cedulaEmpresa}/empleados`)
      .valueChanges({ idField: 'id' })
      .pipe(
        map((items: any[]) =>
          items.map(item => ({
            id: item.id,
            empresaId: item.empresaId ?? '',
            empresaCedula: item.empresaCedula ?? '',
            cedula: item.cedula ?? '',
            nombre: item.nombre ?? '',
            puesto: item.puesto ?? '',
            fechaIngreso: item.fechaIngreso ?? '',
            tipoPago: item.tipoPago ?? 'mensual',
            salarioMensual: item.salarioMensual ?? 0,
            salarioDiario: item.salarioDiario ?? 0,
            tipoContrato: item.tipoContrato ?? 'indefinido',
            fechaFinContrato: item.fechaFinContrato ?? ''
          }))
        )
      );
  }


  // ===========================
  // 📌 AGREGAR EMPLEADO
  // ===========================
  agregar(e: Empleado) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();
    const id = e.id || uuid();

    return this.afs
      .collection(`empresas/${cedulaEmpresa}/empleados`)
      .doc(id)
      .set(e);
  }

  // ===========================
  // 📌 ACTUALIZAR EMPLEADO
  // ===========================
  actualizar(e: Empleado) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();

    return this.afs
      .collection(`empresas/${cedulaEmpresa}/empleados`)
      .doc(e.id)
      .update(e);
  }

  // ===========================
  // 📌 ELIMINAR EMPLEADO
  // ===========================
  eliminar(id: string) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();

    return this.afs
      .collection(`empresas/${cedulaEmpresa}/empleados`)
      .doc(id)
      .delete();
  }
}
