import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from '@angular/fire/firestore';
import { SesionService } from '../../services/sesion.service';
import { PerfilesService } from '../../services/perfiles.service';
import { AuditoriaService } from '../../services/auditoria.service';
import { v4 as uuid } from 'uuid';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  perfil: string;
  estado: 'activo' | 'inactivo';
  fechaCreacion: Date;
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

  constructor(
    private firestore: Firestore,
    private sesionService: SesionService,
    private perfilesService: PerfilesService,
    private auditoriaService: AuditoriaService
  ) {}

  ngOnInit() {
    this.usuarioActivo = this.sesionService.getUsuarioActivo();
    this.perfiles = this.perfilesService.obtenerTodos();
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    try {
      const empresa = await this.sesionService.obtenerEmpresaActual();
      if (!(empresa as any)?.id) return;

      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('empresaId', '==', (empresa as any).id));
      const snapshot = await getDocs(q);

      this.usuariosEmpresa = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Usuario));
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  puedeGestionar(): boolean {
    const perfil = this.usuarioActivo?.perfil;
    return this.perfilesService.tienepermiso(perfil, 'configuracion', 'gestionarUsuarios');
  }

  puedeAgregarPerfil(perfilAgregando: string): boolean {
    const perfil = this.usuarioActivo?.perfil;
    if (perfil === 'supervisor') return true;
    if (perfil === 'administrador') {
      return perfilAgregando !== 'supervisor';
    }
    return false;
  }

  abrirFormulario() {
    this.mostrarFormulario = true;
    this.editando = null;
    this.limpiarFormulario();
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
  }

  async guardarUsuario() {
    if (!this.formData.email || !this.formData.nombre || !this.formData.perfil) {
      this.error = 'Completa todos los campos';
      return;
    }

    if (!this.puedeAgregarPerfil(this.formData.perfil)) {
      this.error = 'No puedes asignar este perfil';
      return;
    }

    this.procesando = true;
    this.error = null;

    try {
      const empresa = await this.sesionService.obtenerEmpresaActual();

      if (this.editando) {
        await updateDoc(doc(this.firestore, 'usuarios', this.editando.id), {
          nombre: this.formData.nombre,
          perfil: this.formData.perfil
        });

        await this.auditoriaService.registrarAccion(
          'configuracion',
          'editar',
          `Perfil de usuario actualizado a: ${this.formData.perfil}`,
          this.editando.id,
          { emailUsuario: this.formData.email }
        );
      } else {
        const nuevoUsuario = {
          id: uuid(),
          email: this.formData.email,
          nombre: this.formData.nombre,
          perfil: this.formData.perfil,
          empresaId: (empresa as any)?.id,
          estado: 'activo',
          fechaCreacion: new Date()
        };

        await addDoc(collection(this.firestore, 'usuarios'), nuevoUsuario);

        await this.auditoriaService.registrarAccion(
          'configuracion',
          'crear',
          `Nuevo usuario agregado con perfil: ${this.formData.perfil}`,
          nuevoUsuario.id,
          { email: this.formData.email }
        );
      }

      this.exito = true;
      this.cargarUsuarios();
      setTimeout(() => this.exito = false, 2000);
      this.cerrarFormulario();
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.procesando = false;
    }
  }

  async eliminarUsuario(usuario: Usuario) {
    if (!this.puedeGestionar()) {
      this.error = 'No tienes permiso para eliminar usuarios';
      return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar a ${usuario.nombre}?`)) {
      try {
        await deleteDoc(doc(this.firestore, 'usuarios', usuario.id));

        await this.auditoriaService.registrarAccion(
          'configuracion',
          'eliminar',
          `Usuario eliminado: ${usuario.nombre}`,
          usuario.id,
          { email: usuario.email }
        );

        this.cargarUsuarios();
      } catch (error: any) {
        this.error = error.message;
      }
    }
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editando = null;
    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.formData = {
      email: '',
      nombre: '',
      perfil: 'secretario'
    };
  }

  obtenerNombrePerfil(id: string): string {
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-CR');
  }
}
