import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, deleteDoc, query, where, orderBy, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { obtenerEmpresaId } from './empresa-utils';

export interface Incapacidad {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  mes: string;
  tipo: 'enfermedad' | 'accidente' | 'maternidad' | 'permisosg' | 'paternidad';
  numIncapacidad: string;
}

@Injectable({ providedIn: 'root' })
export class IncapacidadesService {

  constructor(private firestore: Firestore) { }

  private getEmpresaId(): string {
    return obtenerEmpresaId();
  }

  obtener(): Observable<Incapacidad[]> {
    const empresaId = this.getEmpresaId();
    
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${empresaId}/incapacidades`),
        orderBy('fechaInicio', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Incapacidad[];
        observer.next(data);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  obtenerPorEmpleado(empleadoId: string): Observable<Incapacidad[]> {
    const empresaId = this.getEmpresaId();
    
    return new Observable(observer => {
      const q = query(
        collection(this.firestore, `empresas/${empresaId}/incapacidades`),
        where('empleadoId', '==', empleadoId),
        orderBy('fechaInicio', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Incapacidad[];
        observer.next(data);
      }, (error) => {
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  guardar(incapacidad: Incapacidad) {
    const empresaId = this.getEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/incapacidades/${incapacidad.id}`);
    return setDoc(docRef, incapacidad);
  }

  eliminar(id: string) {
    const empresaId = this.getEmpresaId();
    const docRef = doc(this.firestore, `empresas/${empresaId}/incapacidades/${id}`);
    return deleteDoc(docRef);
  }

  public calcularIncapacidadesMes(incapacidades: Incapacidad[], empleadoId: string | number, mes: string) {
    const [anio, mesNum] = mes.split('-');
    const inicioMes = new Date(Number(anio), Number(mesNum) - 1, 1);
    const finMes = new Date(Number(anio), Number(mesNum), 0);

    const parseFechaLocal = (fecha: string): Date => {
      const [y, m, d] = fecha.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const todas = incapacidades
      .filter((i) => i.empleadoId === empleadoId)
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

    let bloques: { inicio: Date; fin: Date; tipo: string }[] = [];
    let temp: any = null;

    for (const inc of todas) {
      const ini = parseFechaLocal(inc.fechaInicio);
      const fi = parseFechaLocal(inc.fechaFin);

      if (!temp) {
        temp = { inicio: ini, fin: fi, tipo: inc.tipo };
        continue;
      }

      const sig = new Date(temp.fin);
      sig.setDate(sig.getDate() + 1);

      if (ini.getTime() === sig.getTime() && inc.tipo === temp.tipo) {
        temp.fin = fi;
      } else {
        bloques.push(temp);
        temp = { inicio: ini, fin: fi, tipo: inc.tipo };
      }
    }
    if (temp) bloques.push(temp);

    let diasIncap = 0;
    let dias50 = 0;

    for (const b of bloques) {
      if (b.fin < inicioMes || b.inicio > finMes) continue;

      const ini = b.inicio < inicioMes ? inicioMes : b.inicio;
      const fi = b.fin > finMes ? finMes : b.fin;

      const diasMes =
        Math.floor((fi.getTime() - ini.getTime()) / 86400000) + 1;

      if (b.tipo === 'enfermedad') {
        let diasPrevios = 0;

        if (b.inicio < inicioMes) {
          const ultimoDiaMesAnterior = new Date(inicioMes);
          ultimoDiaMesAnterior.setDate(ultimoDiaMesAnterior.getDate() - 1);

          const iniPrev = b.inicio;
          const finPrev = ultimoDiaMesAnterior;

          diasPrevios =
            Math.floor((finPrev.getTime() - iniPrev.getTime()) / 86400000) + 1;
        }

        const restantes50 = Math.max(3 - diasPrevios, 0);
        const d50 = Math.min(restantes50, diasMes);

        dias50 += d50;
        diasIncap += diasMes;

      } else if (
        b.tipo === 'accidente' ||
        b.tipo === 'maternidad' ||
        b.tipo === 'permisosg'
      ) {
        diasIncap += diasMes;
      }
    }

    return {
      diasIncap,
      dias50
    };
  }
}
