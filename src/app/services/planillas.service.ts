import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { SesionService } from './sesion.service';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';

export interface Planilla {
  id?: string;
  mes: string;
  fechaCreacion: string;
  totalNeto: number;
  totalCargas: number;
  detalleEmpleados: { id: string | number; salarioNeto: number }[];
  empresaCedula: string;
}

@Injectable({ providedIn: 'root' })
export class PlanillasService {

  constructor(
    private afs: AngularFirestore,
    private sesionService: SesionService
  ) { }

  private obtenerEmpresaCedula() {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  obtener() {
    const cedulaEmpresa = this.obtenerEmpresaCedula();
    return this.afs
      .collection(`empresas/${cedulaEmpresa}/planillas`)
      .valueChanges({ idField: 'id' });
  }

  agregar(planilla: Planilla) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();
    const id = planilla.id ?? uuid(); // <-- si viene undefined, genero uno

    const data: Planilla = {
      ...planilla,
      id
    };

    return this.afs
      .collection(`empresas/${cedulaEmpresa}/planillas`)
      .doc(id)
      .set(data);
  }

  eliminar(id: string) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();

    return this.afs
      .collection(`empresas/${cedulaEmpresa}/planillas`)
      .doc(id)
      .delete();
  }

  /** Verifica si ya existe una planilla registrada para el mes */
  existePlanillaMes(mes: string) {
    const cedula = this.obtenerEmpresaCedula();
    return this.afs
      .collection<Planilla>(`empresas/${cedula}/planillas`, ref =>
        ref.where('mes', '==', mes)
      )
      .get(); // <-- ESTO evita que se dispare varias veces
  }
  /** Método que nos permite obtener los días trabajados de un empleado*/
  obtenerDiasTrabajadosPorEmpleado(empleadoId: number): Observable<any[]> {
    const empresaId = this.sesionService.getCedulaEmpresaActual();

    return this.afs.collection(
      `empresas/${empresaId}/planillas`,
      ref => ref.where('detalleEmpleados', 'array-contains', { id: empleadoId })
    ).valueChanges();
  }



}
