import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';
import { ConfiguracionService } from '../services/configuracion.service';
import { AuthService } from '../services/auth.service';
import { Empresa } from '../models/usuario.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {

  usuarioActivo: any;
  empresa: Empresa | null = null;
  cargando = true;
  logoBase64: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private sesionService: SesionService,
    private configuracionService: ConfiguracionService,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    this.usuarioActivo = this.sesionService.getUsuarioActivo();

    if (this.usuarioActivo) {
      this.empresa = await this.sesionService.obtenerEmpresaActual();
    }

    // Cargar logo personalizado
    this.cargarLogo();

    this.cargando = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarLogo(): void {
    this.configuracionService.obtenerLogo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data?.base64) {
          this.logoBase64 = data.base64;
        }
      });
  }

  get nombreEmpresa(): string {
    return this.empresa?.nombre || 'Empresa desconocida';
  }

  get cedulaEmpresa(): string {
    return this.empresa?.cedula || 'Sin cédula';
  }

  get logoDisplay(): string {
    if (this.logoBase64) {
      return this.logoBase64;
    }
    return 'assets/LogoDefault.jpg';
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    localStorage.removeItem('usuarioActivo');
    localStorage.removeItem('empresaActiva');
    this.router.navigate(['/login']);
  }

  puedeEditar(): boolean {
    return this.usuarioActivo?.rol === 'admin' || this.usuarioActivo?.rol === 'supervisor';
  }
}
