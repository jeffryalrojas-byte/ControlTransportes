import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  mostrarNavbar = false;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Detectar cambios de ruta en tiempo real
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.actualizarVisibilidadNavbar();
      });

    // Verificar ruta inicial
    this.actualizarVisibilidadNavbar();
  }

  private actualizarVisibilidadNavbar(): void {
    const rutaActual = this.router.url;
    // Mostrar navbar solo en rutas protegidas (no en login/registro)
    this.mostrarNavbar = !rutaActual.includes('/login') && !rutaActual.includes('/registro');
  }
}
