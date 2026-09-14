import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { PerfilesService } from '../../services/perfiles.service';
import { SesionService } from '../../services/sesion.service';
import { AuditoriaService } from '../../services/auditoria.service';
import { Perfil, PERMISOS_DISPONIBLES, PERFILES_DEFAULT } from '../../models/usuario.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-gestion-perfiles',
  templateUrl: './gestion-perfiles.component.html',
  styleUrls: ['./gestion-perfiles.component.scss']
})
export class GestionPerfilesComponent implements OnInit {
  perfiles: Perfil[] = [];
  perfilSeleccionado: Perfil | null = null;
  permisosDisponibles: { [key: string]: string } = {};
  permisosAgrupados: { [modulo: string]: string[] } = {};
  usuarioActivo: any;
  empresaId: string = '';

  mostrarFormulario = false;
  editando = false;
  cargando = false;

  formData = {
    nombre: '',
    descripcion: '',
    permisos: [] as string[]
  };

  error: string | null = null;
  exito = false;

  constructor(
    private perfilesService: PerfilesService,
    private sesionService: SesionService,
    private auditoriaService: AuditoriaService,
    private snackBar: MatSnackBar,
    private firestore: Firestore
  ) {}

  async ngOnInit() {
    this.usuarioActivo = this.sesionService.getUsuarioActivo();
    this.empresaId = this.sesionService.getEmpresaIdActiva() || '';

    if (!this.puedeGestionar()) {
      this.error = 'No tienes permiso para gestionar perfiles';
      return;
    }

    await this.cargarPerfiles();
    this.permisosDisponibles = this.perfilesService.obtenerPermisosDisponibles();
    this.permisosAgrupados = this.perfilesService.agruparPermisosPorModulo();
  }

  async cargarPerfiles() {
    try {
      this.cargando = true;
      this.perfiles = await this.perfilesService.obtenerTodos(this.empresaId);
    } catch (error: any) {
      this.error = 'Error cargando perfiles: ' + error.message;
      this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }

  puedeGestionar(): boolean {
    return this.usuarioActivo?.perfil === 'supervisor';
  }

  seleccionarPerfil(perfil: Perfil) {
    this.perfilSeleccionado = perfil;
  }

  abrirFormularioNuevo() {
    this.editando = false;
    this.perfilSeleccionado = null;
    this.formData = {
      nombre: '',
      descripcion: '',
      permisos: []
    };
    this.mostrarFormulario = true;
    this.error = null;
  }

  abrirFormularioEditar(perfil: Perfil) {
    if (perfil.esDefault) {
      this.snackBar.open('No se pueden editar perfiles por defecto', 'Cerrar', { duration: 3000 });
      return;
    }

    this.editando = true;
    this.perfilSeleccionado = perfil;
    this.formData = {
      nombre: perfil.nombre,
      descripcion: perfil.descripcion,
      permisos: [...perfil.permisos]
    };
    this.mostrarFormulario = true;
    this.error = null;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.perfilSeleccionado = null;
    this.formData = {
      nombre: '',
      descripcion: '',
      permisos: []
    };
  }

  togglePermiso(permiso: string) {
    const index = this.formData.permisos.indexOf(permiso);
    if (index > -1) {
      this.formData.permisos.splice(index, 1);
    } else {
      this.formData.permisos.push(permiso);
    }
  }

  toggleTodosPermisosModulo(modulo: string) {
    const permisos = this.permisosAgrupados[modulo] || [];
    const todosSeleccionados = permisos.every(p => this.formData.permisos.includes(p));

    if (todosSeleccionados) {
      this.formData.permisos = this.formData.permisos.filter(p => !permisos.includes(p));
    } else {
      this.formData.permisos = [...new Set([...this.formData.permisos, ...permisos])];
    }
  }

  async guardarPerfil() {
    if (!this.formData.nombre.trim()) {
      this.error = 'El nombre del perfil es requerido';
      return;
    }

    if (this.formData.permisos.length === 0) {
      this.error = 'Debe seleccionar al menos un permiso';
      return;
    }

    this.cargando = true;
    this.error = null;

    try {
      if (this.editando && this.perfilSeleccionado) {
        await this.perfilesService.actualizarPerfil(
          this.perfilSeleccionado.id,
          {
            nombre: this.formData.nombre,
            descripcion: this.formData.descripcion,
            permisos: this.formData.permisos
          },
          this.empresaId
        );

        await this.auditoriaService.registrarAccion(
          'configuracion',
          'editar',
          `Perfil "${this.formData.nombre}" actualizado`,
          this.perfilSeleccionado.id,
          { permisos: this.formData.permisos.length }
        );

        this.snackBar.open('✅ Perfil actualizado exitosamente', 'Cerrar', { duration: 3000 });
      } else {
        await this.perfilesService.crearPerfil(
          {
            nombre: this.formData.nombre,
            descripcion: this.formData.descripcion,
            permisos: this.formData.permisos,
            esDefault: false,
            empresaId: this.empresaId
          },
          this.empresaId
        );

        await this.auditoriaService.registrarAccion(
          'configuracion',
          'crear',
          `Nuevo perfil "${this.formData.nombre}" creado`,
          '',
          { permisos: this.formData.permisos.length }
        );

        this.snackBar.open('✅ Perfil creado exitosamente', 'Cerrar', { duration: 3000 });
      }

      this.exito = true;
      setTimeout(() => this.exito = false, 2000);
      await this.cargarPerfiles();
      this.cerrarFormulario();
    } catch (error: any) {
      this.error = error.message;
      this.snackBar.open('❌ Error: ' + this.error, 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }

  async eliminarPerfil(perfil: Perfil) {
    if (perfil.esDefault) {
      this.snackBar.open('No se pueden eliminar perfiles por defecto', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar el perfil "${perfil.nombre}"?`)) {
      return;
    }

    try {
      this.cargando = true;

      const usuariosRef = collection(this.firestore, 'usuarios');
      const q = query(usuariosRef, where('perfil', '==', perfil.id), where('empresaId', '==', this.empresaId));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        this.error = `No se puede eliminar este perfil porque ${snapshot.size} usuario(s) lo usan`;
        this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
        return;
      }

      await this.perfilesService.eliminarPerfil(perfil.id, this.empresaId);

      await this.auditoriaService.registrarAccion(
        'configuracion',
        'eliminar',
        `Perfil "${perfil.nombre}" eliminado`,
        perfil.id,
        {}
      );

      this.snackBar.open('✅ Perfil eliminado exitosamente', 'Cerrar', { duration: 3000 });
      await this.cargarPerfiles();
      this.perfilSeleccionado = null;
    } catch (error: any) {
      this.error = error.message;
      this.snackBar.open('❌ Error: ' + this.error, 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }

  obtenerDescripcionPermiso(permiso: string): string {
    return this.permisosDisponibles[permiso] || permiso;
  }

  obtenerPermisosPerfil(perfil: Perfil): string {
    return perfil.permisos.length > 0 ? perfil.permisos.length + ' permisos' : 'Sin permisos';
  }

  estaModuloCompleto(modulo: string): boolean {
    const permisos = this.permisosAgrupados[modulo] || [];
    return permisos.length > 0 && permisos.every(p => this.formData.permisos.includes(p));
  }

  estaModuloIncompleto(modulo: string): boolean {
    const permisos = this.permisosAgrupados[modulo] || [];
    const algunos = permisos.some(p => this.formData.permisos.includes(p));
    return algunos && !this.estaModuloCompleto(modulo);
  }

  /**
   * Contar permisos seleccionados de un módulo
   * Se extrajo del template porque Angular no permite arrow functions en bindings
   */
  contarPermisosSeleccionados(modulo: string): number {
    const permisos = this.permisosAgrupados[modulo] || [];
    return permisos.filter(permiso => this.formData.permisos.includes(permiso)).length;
  }

  /**
   * Contar total de permisos de un módulo
   */
  contarPermisosModulo(modulo: string): number {
    return (this.permisosAgrupados[modulo] || []).length;
  }
}
