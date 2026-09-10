import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, orderBy } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Transaccion {
  id: string;
  usuarioId: string;
  planId: string;
  planNombre: string;
  monto: number;
  moneda: 'USD' | 'CRC';
  estado: 'pendiente' | 'completado' | 'fallido';
  metodoPago: 'tarjeta' | 'stripe' | 'paypal' | 'placetopay';
  fecha: Date;
  email: string;
  nombre: string;
  ultimosCuatro: string;
  stripeChargeId?: string;
  referencia?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransaccionesService {

  private transaccionesSubject = new BehaviorSubject<Transaccion[]>([]);

  constructor(private firestore: Firestore) {}

  async guardarTransaccion(transaccion: Transaccion): Promise<void> {
    try {
      const transaccionesRef = collection(this.firestore, 'transacciones');
      await addDoc(transaccionesRef, {
        ...transaccion,
        fecha: new Date(transaccion.fecha)
      });
    } catch (error) {
      console.error('Error guardando transacción:', error);
      throw error;
    }
  }

  obtenerTransacciones(usuarioId: string): Observable<Transaccion[]> {
    try {
      const transaccionesRef = collection(this.firestore, 'transacciones');
      const q = query(
        transaccionesRef,
        where('usuarioId', '==', usuarioId),
        orderBy('fecha', 'desc')
      );

      getDocs(q).then(snapshot => {
        const transacciones = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaccion[];
        
        this.transaccionesSubject.next(transacciones);
      });

      return this.transaccionesSubject.asObservable();
    } catch (error) {
      console.error('Error obteniendo transacciones:', error);
      return this.transaccionesSubject.asObservable();
    }
  }

  obtenerTransaccionesPorPlan(usuarioId: string, planId: string): Observable<Transaccion[]> {
    try {
      const transaccionesRef = collection(this.firestore, 'transacciones');
      const q = query(
        transaccionesRef,
        where('usuarioId', '==', usuarioId),
        where('planId', '==', planId)
      );

      getDocs(q).then(snapshot => {
        const transacciones = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaccion[];
        
        this.transaccionesSubject.next(transacciones);
      });

      return this.transaccionesSubject.asObservable();
    } catch (error) {
      console.error('Error obteniendo transacciones por plan:', error);
      return this.transaccionesSubject.asObservable();
    }
  }

  obtenerSaldo(usuarioId: string): Observable<number> {
    try {
      const transaccionesRef = collection(this.firestore, 'transacciones');
      const q = query(
        transaccionesRef,
        where('usuarioId', '==', usuarioId),
        where('estado', '==', 'completado')
      );

      getDocs(q).then(snapshot => {
        const total = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data() as Transaccion;
          return sum + data.monto;
        }, 0);
        
        this.transaccionesSubject.next([]);
      });

      return new BehaviorSubject(0).asObservable();
    } catch (error) {
      console.error('Error calculando saldo:', error);
      return new BehaviorSubject(0).asObservable();
    }
  }
}
