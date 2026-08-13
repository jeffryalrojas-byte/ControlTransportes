import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Usuario {
  usuario: string;
  password: string;
  empresa: string;
  rol: 'Supervisor' | 'Administrador';
}

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
  mostrarHint = true; // Cambiar a false en producción

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

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.inicializarForm();
    this.cargarCredencialesRecordadas();
  }

  inicializarForm(): void {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      empresa: [this.empresas[0].nombre, Validators.required],
      recordarme: [false]
    });
  }

  cargarCredencialesRecordadas(): void {
    const credenciales = localStorage.getItem('credencialesRecordadas');
    if (credenciales) {
      try {
        const datos = JSON.parse(credenciales);
        this.loginForm.patchValue({
          usuario: datos.usuario,
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

  ingresar(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor complete todos los campos correctamente';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    // Simular validación en servidor (delay de 1 segundo)
    setTimeout(() => {
      const { usuario, password, empresa, recordarme } = this.loginForm.value;

      const user = this.usuarios.find(
        u => u.usuario === usuario && u.password === password && u.empresa === empresa
      );

      if (!user) {
        this.cargando = false;
        this.errorMessage = 'Usuario, contraseña o empresa incorrectos';
        this.snackBar.open('❌ ' + this.errorMessage, 'Cerrar', { duration: 5000 });
        return;
      }

      // Guardar credenciales si está marcado "Recordarme"
      if (recordarme) {
        localStorage.setItem('credencialesRecordadas', JSON.stringify({
          usuario,
          empresa
        }));
      } else {
        localStorage.removeItem('credencialesRecordadas');
      }

      // Guardar sesión
      localStorage.setItem('usuarioActivo', JSON.stringify(user));
      
      // Mostrar mensaje de éxito
      this.snackBar.open(`✅ Bienvenido ${user.rol}`, 'Cerrar', { duration: 3000 });

      // Navegar después de un delay pequeño
      setTimeout(() => {
        this.cargando = false;
        this.router.navigate(['/rrhh']);
      }, 800);
    }, 1000);
  }
}
