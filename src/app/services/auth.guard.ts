import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener datos del usuario desde Firestore
    const usuario = await this.userService.obtenerUsuario(currentUser.uid);

    if (!usuario) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si está inactivo o suspendido
    if (usuario.estado !== 'activo') {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    // Verificar si requiere rol específico
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && !requiredRoles.includes(usuario.rol)) {
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    // Actualizar último login
    await this.userService.actualizarLastLogin(currentUser.uid);

    return true;
  }
}
