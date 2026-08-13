import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { EmpresaService } from '../services/empresa.service';
import { Empresa } from '../models/usuario.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('800ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('700ms 200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('shake', [
      transition(':enter', [
        animate('600ms', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-10px)', offset: 0.25 }),
          style({ transform: 'translateX(10px)', offset: 0.5 }),
          style({ transform: 'translateX(-10px)', offset: 0.75 }),
          style({ transform: 'translateX(0)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  cargando = false;
  mostrarContrasena = false;
  errorMessage = '';
  mostrarHint = false;
  empresas: Empresa[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private userService: UserService,
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.inicializarForm();
    this.cargarCredencialesRecordadas();
    this.cargarEmpresas();
  }

  inicializarForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      empresa: ['', Validators.required],
      recordarme: [false]
    });
  }

  async cargarEmpresas(): Promise<void> {
    try {
      this.empresas = await this.empresaService.obtenerTodasEmpresas();
      if (this.empresas.length > 0) {
        this.loginForm.patchValue({ empresa: this.empresas[0].id });
      }
    } catch (error: any) {
      console.error('Error al cargar empresas:', error);
      this.snackBar.open('Error al cargar empresas', 'Cerrar', { duration: 3000 });
    }
  }

  cargarCredencialesRecordadas(): void {
    const credenciales = localStorage.getItem('credencialesRecordadas');
    if (credenciales) {
      try {
        const datos = JSON.parse(credenciales);
        this.loginForm.patchValue({
          email: datos.email,
          empresa: datos.empresa,
          recordarme: true
        });
      } catch (e) {
        console.error('Error al cargar credenciales recordadas', e);
      }
    }
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  async ingresar(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor complete todos los campos correctamente';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    try {
      const { email, password, empresa, recordarme } = this.loginForm.value;

      // 1. Login en Firebase Auth
      const userCredential = await this.authService.login(email, password);

      // 2. Obtener datos del usuario desde Firestore
      const usuario = await this.userService.obtenerUsuario(userCredential.uid);

      if (!usuario) {
        throw new Error('No se encontraron datos del usuario. Contacta al administrador.');
      }

      // 3. Verificar que el usuario pertenece a la empresa seleccionada
      if (usuario.empresaId !== empresa) {
        throw new Error('Este usuario no tiene acceso a la empresa seleccionada.');
      }

      // 4. Verificar estado del usuario
      if (usuario.estado !== 'activo') {
        await this.authService.logout();
        throw new Error('Tu cuenta está inactiva o suspendida. Contacta al administrador.');
      }

      // 5. Guardar credenciales si está marcado "Recordarme"
      if (recordarme) {
        localStorage.setItem('credencialesRecordadas', JSON.stringify({ email, empresa }));
      } else {
        localStorage.removeItem('credencialesRecordadas');
      }

      // 6. Guardar datos en localStorage
      localStorage.setItem('usuarioActivo', JSON.stringify(usuario));
      localStorage.setItem('empresaActiva', empresa);

      this.snackBar.open(`✅ Bienvenido ${usuario.nombre}`, 'Cerrar', { duration: 3000 });

      setTimeout(() => {
        this.cargando = false;
        this.router.navigate(['/rrhh']);
      }, 800);
    } catch (error: any) {
      this.cargando = false;
      this.errorMessage = error.message || 'Error al iniciar sesión';
      this.snackBar.open('❌ ' + this.errorMessage, 'Cerrar', { duration: 5000 });
    }
  }

  irARegistro(): void {
    this.router.navigate(['/registro']);
  }
}
