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

      console.log('📝 Iniciando registro con:');
      console.log('- Nombre:', nombre);
      console.log('- Email:', email);
      console.log('- Empresa:', nombreEmpresa);
      console.log('- Plan:', plan);

      // ============================================================
      // PASO 1: Crear usuario en Firebase Auth
      // ============================================================
      console.log('1️⃣ Creando usuario en Firebase Auth...');
      const userCredential = await this.authService.registro(email, password, nombre);
      console.log('✅ Usuario creado en Firebase Auth. UID:', userCredential.uid);

      // ============================================================
      // PASO 2: Crear empresa en Firestore
      // ============================================================
      console.log('2️⃣ Creando empresa en Firestore...');
      const empresa = await this.userService.crearEmpresa(
        nombreEmpresa,
        cedula,
        userCredential.uid,
        plan as 'free' | 'professional' | 'business'
      );
      console.log('✅ Empresa creada. ID:', empresa.id);
      console.log('   - Nombre:', empresa.nombre);
      console.log('   - Plan:', empresa.plan);

      // ============================================================
      // PASO 3: Crear registro de usuario en Firestore con perfil supervisor
      // ============================================================
      console.log('3️⃣ Creando documento de usuario en Firestore con perfil SUPERVISOR...');
      await this.userService.crearUsuario(
        userCredential.uid,
        email,
        nombre,
        empresa.id,
        'supervisor'  // 👈 PERFIL: supervisor
      );
      console.log('✅ Usuario guardado en Firestore con perfil SUPERVISOR');
      console.log('   - UID:', userCredential.uid);
      console.log('   - Email:', email);
      console.log('   - Nombre:', nombre);
      console.log('   - Perfil:', 'supervisor');
      console.log('   - Empresa ID:', empresa.id);

      // ============================================================
      // PASO 4: Guardar datos en localStorage
      // ============================================================
      console.log('4️⃣ Guardando datos en localStorage...');
      localStorage.setItem('usuarioActivo', JSON.stringify({
        uid: userCredential.uid,
        email: email,
        nombre: nombre,
        perfil: 'supervisor',
        empresaId: empresa.id,
        estado: 'activo'
      }));
      localStorage.setItem('empresaActiva', empresa.id);
      console.log('✅ Datos guardados en localStorage');

      this.snackBar.open('✅ Cuenta creada exitosamente', 'Cerrar', { duration: 3000 });

      // ============================================================
      // PASO 5: Redirigir al dashboard
      // ============================================================
      console.log('5️⃣ Redirigiendo a /rrhh...');
      setTimeout(() => {
        this.cargando = false;
        this.router.navigate(['/rrhh']);
      }, 1000);

      console.log('🎉 REGISTRO COMPLETADO CON ÉXITO');

    } catch (error: any) {
      this.cargando = false;
      this.errorMessage = error.message || 'Error al registrar la cuenta';
      console.error('❌ Error en registro:', error);
      this.snackBar.open('❌ ' + this.errorMessage, 'Cerrar', { duration: 5000 });
    }
  }
}
