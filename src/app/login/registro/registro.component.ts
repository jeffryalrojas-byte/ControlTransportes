import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { PLANES_DISPONIBLES, Plan } from '../../models/usuario.model';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
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
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  cargando = false;
  mostrarContrasena = false;
  mostrarConfirmar = false;
  errorMessage = '';
  planes: Plan[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.inicializarForm();
    this.cargarPlanes();
  }

  inicializarForm(): void {
    this.registroForm = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmarPassword: ['', [Validators.required, Validators.minLength(6)]],
        nombreEmpresa: ['', [Validators.required, Validators.minLength(3)]],
        cedula: ['', [Validators.required]],
        plan: ['free', Validators.required],
        aceptaTerminos: [false, Validators.requiredTrue]
      },
      {
        validators: this.passwordMatchValidator
      }
    );
  }

  cargarPlanes(): void {
    this.planes = Object.values(PLANES_DISPONIBLES).filter(p => p.id !== 'enterprise');
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmarPassword = control.get('confirmarPassword')?.value;

    if (password && confirmarPassword && password !== confirmarPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  seleccionarPlan(planId: string): void {
    this.registroForm.patchValue({ plan: planId });
  }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleMostrarConfirmar(): void {
    this.mostrarConfirmar = !this.mostrarConfirmar;
  }

  async registrarse(): Promise<void> {
    if (this.registroForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    try {
      const { nombre, email, password, nombreEmpresa, cedula, plan } = this.registroForm.value;

      // 1. Crear usuario en Firebase Auth
      const userCredential = await this.authService.registro(email, password, nombre);

      // 2. Crear empresa en Firestore
      const empresa = await this.userService.crearEmpresa(
        nombreEmpresa,
        cedula,
        userCredential.uid,
        plan
      );

      // 3. Crear registro de usuario en Firestore con rol supervisor (es el propietario)
      await this.userService.crearUsuario(
        userCredential.uid,
        email,
        nombre,
        empresa.id,
        'supervisor'
      );

      this.snackBar.open('✅ Cuenta creada exitosamente', 'Cerrar', { duration: 3000 });

      // 4. Redirigir al dashboard
      setTimeout(() => {
        this.cargando = false;
        this.router.navigate(['/rrhh']);
      }, 1000);
    } catch (error: any) {
      this.cargando = false;
      this.errorMessage = error.message || 'Error al registrar la cuenta';
      this.snackBar.open('❌ ' + this.errorMessage, 'Cerrar', { duration: 5000 });
    }
  }
}
