import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TilopaySession {
  sessionId: string;
  url: string;
  reference: string;
}

export interface TilopayPayment {
  reference: string;
  amount: number;
  currency: 'USD' | 'CRC';
  description: string;
  customerEmail: string;
  customerName: string;
  notifyUrl?: string;
}

@Injectable()
export class TilopayService {
  private backendUrl = 'http://localhost:5001/tu-proyecto-id/us-central1/pagos';

  constructor(private http: HttpClient) {}

  /**
   * Crear sesión de pago en Tilopay
   */
  crearSesionTilopay(pago: TilopayPayment): Observable<TilopaySession> {
    return this.http.post<TilopaySession>(`${this.backendUrl}/crear-sesion-tilopay`, pago);
  }

  /**
   * Verificar estado de pago
   */
  verificarPagoTilopay(reference: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/verificar-pago-tilopay/${reference}`);
  }

  /**
   * Obtener historial de pagos
   */
  obtenerHistorialTilopay(empresaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.backendUrl}/historial-tilopay/${empresaId}`);
  }

  /**
   * Actualizar URL del backend
   */
  actualizarBackendUrl(url: string): void {
    this.backendUrl = url;
  }
}
