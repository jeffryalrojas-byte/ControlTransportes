import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SesionService } from './sesion.service';

@Injectable({
  providedIn: 'root'
})
export class PlanGuard implements CanActivate {

  private planAcceso: { [key: string]: string[] } = {
    'plan_free': ['rrhh', 'planilla', 'incapacidades', 'pagos'],
    'plan_pro': ['rrhh', 'planilla', 'finanzas', 'vacaciones', 'incapacidades', 'configuracion', 'pagos', 'reporteria'],
    'plan_business': ['rrhh', 'planilla', 'finanzas', 'vacaciones', 'incapacidades', 'configuracion', 'pagos', 'reporteria'],
    'plan_enterprise': ['rrhh', 'planilla', 'finanzas', 'vacaciones', 'incapacidades', 'configuracion', 'pagos', 'reporteria']
  };

  constructor(
    private sesionService: SesionService,
    private router: Router
  ) {}

  canActivate(route: any): boolean {
    const modulo = route.data?.modulo;
    if (!modulo) return true;

    // Obtener plan actual de la empresa
    const empresa = this.sesionService.obtenerEmpresaActual();
    const planId = empresa?.plan || 'plan_free';

    const modulosPermitidos = this.planAcceso[planId] || [];

    if (!modulosPermitidos.includes(modulo)) {
      alert(`⚠️ Este módulo requiere un plan superior. Tu plan actual: ${planId}`);
      this.router.navigate(['/pagos']);
      return false;
    }

    return true;
  }
}
