import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SesionService } from '../services/sesion.service';
import { TransaccionesService } from '../services/transacciones.service';
import { v4 as uuid } from 'uuid';

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  moneda: 'USD' | 'CRC';
  caracteristicas: string[];
  descripcion: string;
  color: string;
}

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss']
})
export class PagosComponent implements OnInit {

  usuarioActivo: any;
  planes: Plan[] = [];
  transacciones: any[] = [];

  // Formulario de pago
  mostrarFormulario = false;
  planSeleccionado: Plan | null = null;
  
  nombre = '';
  email = '';
  numeroTarjeta = '';
  mesExpiracion = '';
  anioExpiracion = '';
  cvv = '';
  
  procesando = false;
  error: string | null = null;
  exito = false;

  constructor(
    private http: HttpClient,
    private sesionService: SesionService,
    private transaccionesService: TransaccionesService
  ) {}

  ngOnInit() {
    this.usuarioActivo = this.sesionService.getUsuarioActivo();
    this.cargarPlanes();
    this.cargarTransacciones();
  }

  getEmpresaId(): string {
    return this.sesionService.getEmpresaIdActiva() || '';
  }

  cargarPlanes() {
    this.planes = [
      {
        id: 'plan_free',
        nombre: 'Gratuito',
        precio: 0,
        moneda: 'USD',
        descripcion: 'Perfecto para empezar',
        caracteristicas: [
          'Hasta 10 empleados',
          'Funciones básicas',
          'Soporte por email',
          'Sin acceso a finanzas avanzadas'
        ],
        color: 'primary'
      },
      {
        id: 'plan_pro',
        nombre: 'Pro',
        precio: 29.99,
        moneda: 'USD',
        descripcion: 'Para empresas en crecimiento',
        caracteristicas: [
          'Hasta 100 empleados',
          'Todas las funciones',
          'Soporte prioritario',
          'Reportes avanzados',
          'API access'
        ],
        color: 'accent'
      },
      {
        id: 'plan_enterprise',
        nombre: 'Enterprise',
        precio: 99.99,
        moneda: 'USD',
        descripcion: 'Solución completa empresarial',
        caracteristicas: [
          'Empleados ilimitados',
          'Todas las funciones',
          'Soporte 24/7',
          'Integraciones personalizadas',
          'Server dedicado'
        ],
        color: 'warn'
      }
    ];
  }

  cargarTransacciones() {
    const empresaId = this.getEmpresaId();
    if (empresaId) {
      this.transaccionesService.obtenerTransacciones(empresaId)
        .subscribe(transacciones => {
          this.transacciones = transacciones;
        });
    }
  }

  seleccionarPlan(plan: Plan) {
    if (plan.precio === 0) {
      alert('El plan gratuito se activa inmediatamente');
      return;
    }
    
    this.planSeleccionado = plan;
    this.mostrarFormulario = true;
    this.nombre = this.usuarioActivo?.nombre || '';
    this.email = this.usuarioActivo?.email || '';
  }

  validarTarjeta(): boolean {
    if (!this.numeroTarjeta || this.numeroTarjeta.length !== 16) {
      this.error = 'Número de tarjeta inválido (16 dígitos)';
      return false;
    }
    if (!this.cvv || this.cvv.length < 3) {
      this.error = 'CVV inválido';
      return false;
    }
    if (!this.mesExpiracion || !this.anioExpiracion) {
      this.error = 'Fecha de expiración inválida';
      return false;
    }
    return true;
  }

  async procesarPago() {
    if (!this.validarTarjeta() || !this.planSeleccionado) return;

    this.procesando = true;
    this.error = null;

    try {
      // En producción, esto iría a tu backend
      // que luego se conectaría con Stripe
      const transaccion: any = {
        id: uuid(),
        empresaId: this.getEmpresaId(),
        usuarioId: this.usuarioActivo?.id || '',
        planId: this.planSeleccionado.id,
        planNombre: this.planSeleccionado.nombre,
        monto: this.planSeleccionado.precio,
        moneda: this.planSeleccionado.moneda,
        estado: 'completado' as const,
        metodoPago: 'tarjeta' as const,
        fecha: new Date(),
        email: this.email,
        nombre: this.nombre,
        ultimosCuatro: this.numeroTarjeta.slice(-4)
      };

      // Guardar transacción
      await this.transaccionesService.guardarTransaccion(transaccion);

      this.exito = true;
      this.transacciones.unshift(transaccion);
      
      setTimeout(() => {
        this.limpiar();
      }, 2000);

    } catch (err: any) {
      this.error = err.message || 'Error al procesar el pago';
    } finally {
      this.procesando = false;
    }
  }

  limpiar() {
    this.mostrarFormulario = false;
    this.planSeleccionado = null;
    this.nombre = '';
    this.email = '';
    this.numeroTarjeta = '';
    this.mesExpiracion = '';
    this.anioExpiracion = '';
    this.cvv = '';
    this.exito = false;
    this.error = null;
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CR');
  }

  obtenerNombreMes(mes: number): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[mes - 1] || '';
  }
}
