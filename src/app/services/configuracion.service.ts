import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { SesionService } from '../services/sesion.service';
import { v4 as uuid } from 'uuid';

export interface CargasSociales {
  ccssTrabajador: number;
  ccssPatrono: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

  constructor(
    private afs: AngularFirestore,
    private sesionService: SesionService
  ) { }

  /** 🔹 Obtiene cédula de empresa */
  private getEmpresaCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  /** 🔹 Guarda cargar sociales en Firebase */
  guardarCargas(cargas: CargasSociales) {
    const cedula = this.getEmpresaCedula();

    return this.afs
      .collection(`empresas/${cedula}/configuracion`)
      .doc('cargasSociales')
      .set(cargas, { merge: true });

  }

  /** 🔹 Obtiene cargas desde Firebase */
  obtenerCargas() {
    const cedula = this.getEmpresaCedula();

    return this.afs
      .collection(`empresas/${cedula}/configuracion`)
      .doc<CargasSociales>('cargasSociales')
      .valueChanges();
  }

  /** 🔹 Guarda histórico en Firebase */
  guardarHistorico(cargas: CargasSociales) {
    const cedula = this.getEmpresaCedula();
    const registro = {
      ...cargas,
      fecha: new Date().toLocaleString()
    };

    return this.afs
      .collection(`empresas/${cedula}/configuracion/cargasSociales/historicoCargas`)
      .add(registro);
  }

  /** 🔹 Obtiene el histórico de Firebase */
  obtenerHistorico() {
    const cedula = this.getEmpresaCedula();

    return this.afs
      .collection<{
        ccssTrabajador: number;
        ccssPatrono: number;
        fecha: string
      }>(
        `empresas/${cedula}/configuracion/cargasSociales/historicoCargas`,
        ref => ref.orderBy('fecha', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

}



