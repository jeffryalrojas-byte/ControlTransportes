import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query } from '@angular/fire/firestore';
import { SesionService } from './sesion.service';
import { v4 as uuid } from 'uuid';
import { map, Observable } from 'rxjs';

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
    private firestore: Firestore,
    private sesionService: SesionService
  ) { }

  private obtenerEmpresaCedula() {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  // ===========================
  // 📌 OBTENER EMPLEADOS
  // ===========================
  obtener(): Observable<Empleado[]> {
    const cedulaEmpresa = this.obtenerEmpresaCedula();

    return new Observable(observer => {
      const colRef = collection(this.firestore, `empresas/${cedulaEmpresa}/empleados`);
      
      const unsubscribe = onSnapshot(colRef, (snap) => {
        const items = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as any[];

        const result = items.map(item => ({
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
        }));

        observer.next(result);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }


  // ===========================
  // 📌 AGREGAR EMPLEADO
  // ===========================
  agregar(e: Empleado) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();
    const id = e.id || uuid();

    const docRef = doc(this.firestore, `empresas/${cedulaEmpresa}/empleados/${id}`);
    return setDoc(docRef, e);
  }

  // ===========================
  // 📌 ACTUALIZAR EMPLEADO
  // ===========================
  actualizar(e: Empleado) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();

    const docRef = doc(this.firestore, `empresas/${cedulaEmpresa}/empleados/${e.id}`);
    return updateDoc(docRef, e as any);
  }

  //ESTADO DEL EMPLEADO
  public obtenerEstadoEmpleado(e: Empleado): 'activo' | 'inactivo' {
    if (e.tipoContrato === 'indefinido') {
      return 'activo';
    }

    // Contrato definido
    if (!e.fechaFinContrato) return 'activo';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fin = new Date(e.fechaFinContrato);
    fin.setHours(0, 0, 0, 0);

    return fin >= hoy ? 'activo' : 'inactivo';
  }


  // ===========================
  // 📌 ELIMINAR EMPLEADO
  // ===========================
  eliminar(id: string) {
    const cedulaEmpresa = this.obtenerEmpresaCedula();

    const docRef = doc(this.firestore, `empresas/${cedulaEmpresa}/empleados/${id}`);
    return deleteDoc(docRef);
  }
}
