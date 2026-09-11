/**
 * Utilidad para validar permisos en componentes
 * Uso: this.permisoHelper.puede('eliminar') en templates
 */
import { PerfilesService } from './perfiles.service';
import { SesionService } from './sesion.service';

export class PermisoHelper {
  private perfil: string = '';

  constructor(
    private perfilesService: PerfilesService,
    private sesionService: SesionService
  ) {
    const usuario = this.sesionService.getUsuarioActivo();
    this.perfil = usuario?.perfil || 'secretario';
  }

  puede(accion: string, modulo: string): boolean {
    return this.perfilesService.tienepermiso(this.perfil, modulo, accion);
  }

  puedeVer(modulo: string): boolean {
    return this.puede('ver', modulo);
  }

  puedeAgregar(modulo: string): boolean {
    return this.puede('agregar', modulo);
  }

  puedeEditar(modulo: string): boolean {
    return this.puede('editar', modulo);
  }

  puedeEliminar(modulo: string): boolean {
    return this.puede('eliminar', modulo);
  }

  obtenerPerfil(): string {
    return this.perfil;
  }
}
