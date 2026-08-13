import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from '@angular/fire/firestore';
import { v4 as uuid } from 'uuid';
import { Observable } from 'rxjs';

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

  constructor(private firestore: Firestore) { }

  private obtenerEmpresaId() {
    return localStorage.getItem('empresaActiva') || 'sin_id';
  }

  obtener(): Observable<Empleado[]> {
    const empresaId = this.obtenerEmpresaId();

    return new Observable(observer => {
      const colRef = collection(this.firestore, `empresas/${empresaId}/empleados`);
      
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

  agregar(e: Empleado) {
    const empresaId = this.obtenerEmpresaId();
    const id = e.id || uuid();

    const docRef = doc(this.firestore, `empresas/${empresaId}/empleados/${id}`);
    return setDoc(docRef, e);
  }

  actualizar(e: Empleado) {
    const empresaId = this.obtenerEmpresaId();

    const docRef = doc(this.firestore, `empresas/${empresaId}/empleados/${e.id}`);
    return updateDoc(docRef, e as any);
  }

  public obtenerEstadoEmpleado(e: Empleado): 'activo' | 'inactivo' {
    if (e.tipoContrato === 'indefinido') {
      return 'activo';
    }

    if (!e.fechaFinContrato) return 'activo';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fin = new Date(e.fechaFinContrato);
    fin.setHours(0, 0, 0, 0);

    return fin >= hoy ? 'activo' : 'inactivo';
  }

  eliminar(id: string) {
    const empresaId = this.obtenerEmpresaId();

    const docRef = doc(this.firestore, `empresas/${empresaId}/empleados/${id}`);
    return deleteDoc(docRef);
  }
}
