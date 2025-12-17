// incapacidades.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { SesionService } from '../services/sesion.service';

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

  constructor(
    private afs: AngularFirestore,
    private sesionService: SesionService
  ) { }

  private getCedula(): string {
    return this.sesionService.getCedulaEmpresaActual() || 'sin_cedula';
  }

  /** 🔹 Obtener TODAS las incapacidades de la empresa */
  obtener() {
    const cedula = this.getCedula();
    return this.afs
      .collection<Incapacidad>(
        `empresas/${cedula}/incapacidades`,
        ref => ref.orderBy('fechaInicio', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  /** 🔹 Obtener incapacidades por empleado */
  obtenerPorEmpleado(empleadoId: string) {
    const cedula = this.getCedula();
    return this.afs
      .collection<Incapacidad>(
        `empresas/${cedula}/incapacidades`,
        ref => ref.where('empleadoId', '==', empleadoId).orderBy('fechaInicio', 'desc')
      )
      .valueChanges({ idField: 'id' });
  }

  /** 🔹 Guardar incapacidad */
  guardar(incapacidad: Incapacidad) {
    const cedula = this.getCedula();
    return this.afs
      .collection(`empresas/${cedula}/incapacidades`)
      .doc(incapacidad.id)
      .set(incapacidad);
  }

  /** 🔹 Eliminar incapacidad */
  eliminar(id: string) {
    const cedula = this.getCedula();
    return this.afs
      .collection(`empresas/${cedula}/incapacidades`)
      .doc(id)
      .delete();
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
      .filter(i => i.empleadoId === empleadoId)
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

        // 🔥 días consumidos antes del mes actual
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

