import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Usuario {
  usuario: string;
  password: string;
  empresa: string;
  rol: 'Supervisor' | 'Administrador';
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  usuario = '';
  password = '';
  empresa = 'Transportes D&F'; // Valor por defecto

  empresas = [
    { nombre: 'Transportes D&F', cedula: '3-102-908063' },
    { nombre: 'Transportes GyA', cedula: '3-102-753174' }
  ];

  usuarios: Usuario[] = [
    { usuario: 'admin', password: '1234', empresa: 'Transportes D&F', rol: 'Administrador' },
    { usuario: 'super', password: '98765', empresa: 'Transportes D&F', rol: 'Supervisor' },
    { usuario: 'admin', password: '1234', empresa: 'Transportes GyA', rol: 'Administrador' },
    { usuario: 'super', password: '98765', empresa: 'Transportes GyA', rol: 'Supervisor' }
  ];

  constructor(private router: Router) { }

  ingresar() {
    const user = this.usuarios.find(
      u => u.usuario === this.usuario && u.password === this.password && u.empresa === this.empresa
    );

    if (!user) {
      alert('⚠️ Usuario o contraseña incorrectos');
      return;
    }

    // Guardamos la sesión actual en localStorage
    localStorage.setItem('usuarioActivo', JSON.stringify(user));
    this.router.navigate(['/rrhh']);
  }
}

