import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SesionService } from '../services/sesion.service'; // 👈 importa el servicio

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  usuarioActivo: any;
  nombreEmpresa: string = '';
  cedulaEmpresa: string = '';

  constructor(
    private router: Router,
    private sesionService: SesionService // 👈 inyecta el servicio
  ) { }

  ngOnInit(): void {
    // Obtenemos el usuario desde el servicio
    this.usuarioActivo = this.sesionService.getUsuarioActivo();

    // Si hay usuario activo, traemos la empresa y la cédula desde el servicio
    if (this.usuarioActivo) {
      this.nombreEmpresa = this.sesionService.getEmpresaActual() || 'Empresa desconocida';
      this.cedulaEmpresa = this.sesionService.getCedulaEmpresaActual() || 'Sin cédula';
    }
  }

  logout() {
    localStorage.removeItem('usuarioActivo');
    this.router.navigate(['/login']);
  }

  puedeEditar(): boolean {
    return this.usuarioActivo?.rol === 'Supervisor';
  }

}


