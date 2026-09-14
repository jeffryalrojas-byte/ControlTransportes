import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from '@angular/fire/firestore';
import { SesionService } from '../../services/sesion.service';
import { PerfilesService } from '../../services/perfiles.service';
import { UsuariosService } from '../../services/usuarios.service';
import { AuditoriaService } from '../../services/auditoria.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  perfil: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  fechaCreacion: Date;
  createdBy?: string;
}

@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.scss']
})
export class GestionUsuariosComponent implements OnInit {
  usuarioActivo: any;
  usuariosEmpresa: Usuario[] = [];
  perfiles: any[] = [];

  mostrarFormulario = false;
  editando: Usuario | null = null;

  formData = {
    email: '',
    nombre: '',
    perfil: 'secretario'
  };

  error: string | null = null;
  exito = false;
  procesando = false;
  cargando = false;

  constructor(
    private firestore: Firestore,
    private sesionService: SesionService,
    private perfilesService: PerfilesService,
    private usuariosService: UsuariosService,
    private auditoriaService: AuditoriaService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.usuarioActivo = this.sesionService.getUsuarioActivo();
    this.perfiles = await this.perfilesService.obtenerTodos(this.sesionService.getEmpresaIdActiva() || '');
    
    console.log('Usuario activo:', this.usuarioActivo);
    console.log('Perfiles disponibles:', this.perfiles);

    if (this.puedeGestionar()) {
      await this.cargarUsuarios();
    }
  }

  async cargarUsuarios() {
    try {
      this.cargando = true;
      const empresa = await this.sesionService.obtenerEmpresaActual();
      if (!(empresa as any)?.id) return;

      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('empresaId', '==', (empresa as any).id));
      const snapshot = await getDocs(q);

      this.usuariosEmpresa = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data['email'] || '',
          nombre: data['nombre'] || '',
          perfil: data['perfil'] || 'secretario',
          estado: data['estado'] || 'activo',
          fechaCreacion: data['createdAt']?.toDate?.() || new Date(data['createdAt']) || new Date(),
          createdBy: data['createdBy']
        };
      });
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      this.error = 'Error al cargar usuarios';
    } finally {
      this.cargando = false;
    }
  }

  puedeGestionar(): boolean {
    const perfil = this.usuarioActivo?.perfil;
    return perfil === 'supervisor' || perfil === 'administrador';
  }

  puedeAgregarPerfil(perfilAgregando: string): boolean {
    const perfil = this.usuarioActivo?.perfil;

    // Solo supervisor puede agregar a otros supervisores
    if (perfilAgregando === 'supervisor') {
      return perfil === 'supervisor';
    }

    // Administrador puede agregar admin y secretario, pero no supervisor
    if (perfil === 'administrador') {
      return perfilAgregando !== 'supervisor';
    }

    // Supervisor puede agregar cualquier perfil
    if (perfil === 'supervisor') {
      return true;
    }

    return false;
  }

  abrirFormulario() {
    this.mostrarFormulario = true;
    this.editando = null;
    this.limpiarFormulario();
    this.error = null;
  }

  editarUsuario(usuario: Usuario) {
    if (!this.puedeGestionar()) {
      this.error = 'No tienes permiso para editar usuarios';
      return;
    }
    
    this.editando = usuario;
    this.formData = {
      email: usuario.email,
      nombre: usuario.nombre,
      perfil: usuario.perfil
    };
    this.mostrarFormulario = true;
    this.error = null;
  }

  async guardarUsuario() {
    if (!this.formData.email || !this.formData.nombre || !this.formData.perfil) {
      this.error = 'Completa todos los campos';
      return;
    }

    if (!this.puedeAgregarPerfil(this.formData.perfil)) {
      this.error = 'No tienes permiso para asignar este perfil';
      return;
    }

    this.procesando = true;
    this.error = null;

    try {
      const empresaId = this.sesionService.getEmpresaIdActiva() || '';

      if (this.editando) {
        // === EDITAR USUARIO ===
        await updateDoc(doc(this.firestore, 'usuarios', this.editando.uid), {
          nombre: this.formData.nombre,
          perfil: this.formData.perfil
        });

        await this.auditoriaService.registrarAccion(
          'configuracion',
          'editar',
          `Usuario "${this.formData.nombre}" actualizado. Perfil: ${this.formData.perfil}`,
          this.editando.uid,
          { email: this.formData.email }
        );

        this.snackBar.open('✅ Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
      } else {
        // === CREAR USUARIO VÍA CLOUD FUNCTION ===
        this.snackBar.open('⏳ Creando usuario y enviando email...', 'Cerrar', { duration: 5000 });

        const resultado = await this.usuariosService.crearUsuarioCloudFunction(
          this.formData.email,
          this.formData.nombre,
          this.formData.perfil,
          empresaId,
          this.usuarioActivo.uid
        );

        if (resultado.success) {
          this.snackBar.open(
            `✅ Usuario creado. Email enviado a ${this.formData.email}`,
            'Cerrar',
            { duration: 5000 }
          );

          await this.auditoriaService.registrarAccion(
            'configuracion',
            'crear',
            `Nuevo usuario "${this.formData.nombre}" (${this.formData.email}) creado con perfil ${this.formData.perfil}`,
            resultado.uid,
            { email: this.formData.email, perfil: this.formData.perfil }
          );
        }
      }

      this.exito = true;
      setTimeout(() => this.exito = false, 2000);
      await this.cargarUsuarios();
      this.cerrarFormulario();

    } catch (err: any) {
      this.error = err.message || 'Error al guardar usuario';
      this.snackBar.open('❌ ' + this.error, 'Cerrar', { duration: 5000 });
      console.error('Error:', err);
    } finally {
      this.procesando = false;
    }
  }

  async eliminarUsuario(usuario: Usuario) {
    if (!this.puedeGestionar()) {
      this.error = 'No tienes permiso para eliminar usuarios';
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar a ${usuario.nombre}?`)) {
      return;
    }

    try {
      this.procesando = true;

      // No permitir eliminar al mismo usuario
      if (usuario.uid === this.usuarioActivo.uid) {
        this.snackBar.open('No puedes eliminar tu propia cuenta', 'Cerrar', { duration: 3000 });
        return;
      }

      // Desactivar usuario en lugar de eliminar (más seguro)
      await updateDoc(doc(this.firestore, 'usuarios', usuario.uid), {
        estado: 'inactivo'
      });

      await this.auditoriaService.registrarAccion(
        'configuracion',
        'eliminar',
        `Usuario "${usuario.nombre}" desactivado`,
        usuario.uid,
        { email: usuario.email }
      );

      this.snackBar.open('✅ Usuario desactivado', 'Cerrar', { duration: 3000 });
      await this.cargarUsuarios();

    } catch (error: any) {
      this.error = error.message;
      this.snackBar.open('❌ ' + this.error, 'Cerrar', { duration: 5000 });
    } finally {
      this.procesando = false;
    }
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editando = null;
    this.limpiarFormulario();
    this.error = null;
  }

  limpiarFormulario() {
    this.formData = {
      email: '',
      nombre: '',
      perfil: 'secretario'
    };
  }

  obtenerNombreRol(id: string): string {
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-CR');
  }
}
