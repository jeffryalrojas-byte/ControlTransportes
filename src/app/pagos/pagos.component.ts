import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { SesionService } from '../services/sesion.service';
import { TilopayService, TilopayPayment } from '../services/tilopay.service';
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

  procesando = false;
  error: string | null = null;
  exito = false;

  constructor(
    private http: HttpClient,
    private sesionService: SesionService,
    private tilopayService: TilopayService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.usuarioActivo = this.sesionService.getUsuarioActivo();
    this.cargarPlanes();
    this.cargarTransacciones();
    this.verificarPagoCallback();
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
      this.tilopayService.obtenerHistorialTilopay(empresaId)
        .subscribe(
          (transacciones: any) => {
            this.transacciones = transacciones;
          },
          (error: any) => {
            console.error('Error cargando transacciones:', error);
          }
        );
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

  verificarPagoCallback() {
    this.route.queryParams.subscribe(params => {
      const reference = params['reference'];
      const status = params['status'];

      if (reference && status === 'success') {
        this.tilopayService.verificarPagoTilopay(reference)
          .subscribe(
            (resultado: any) => {
              if (resultado.approved) {
                this.exito = true;
                this.cargarTransacciones();
                setTimeout(() => {
                  this.exito = false;
                }, 3000);
              }
            },
            (error: any) => console.error('Error verificando pago:', error)
          );
      }
    });
  }

  async procesarPago() {
    if (!this.planSeleccionado || !this.nombre || !this.email) {
      this.error = 'Por favor completa nombre y email';
      return;
    }

    this.procesando = true;
    this.error = null;

    try {
      const pago: TilopayPayment = {
        reference: `REF-${Date.now()}`,
        amount: this.planSeleccionado.precio,
        currency: this.planSeleccionado.moneda,
        description: `Suscripción ${this.planSeleccionado.nombre}`,
        customerEmail: this.email,
        customerName: this.nombre,
        notifyUrl: window.location.origin + '/api/webhook-tilopay'
      };

      this.tilopayService.crearSesionTilopay(pago).subscribe(
        async (response: any) => {
          const { url } = response;

          if (url) {
            // Redirigir a Tilopay
            window.location.href = url;
          } else {
            this.error = 'No se pudo obtener la URL de pago';
            this.procesando = false;
          }
        },
        (error: any) => {
          this.error = error.error?.error || 'Error al crear sesión de pago';
          this.procesando = false;
        }
      );
    } catch (err: any) {
      this.error = err.message || 'Error al procesar el pago';
      this.procesando = false;
    }
  }

  limpiar() {
    this.mostrarFormulario = false;
    this.planSeleccionado = null;
    this.nombre = '';
    this.email = '';
    this.exito = false;
    this.error = null;
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CR');
  }
}
