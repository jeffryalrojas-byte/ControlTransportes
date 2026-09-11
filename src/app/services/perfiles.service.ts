import { Injectable } from '@angular/core';

export interface Perfil {
  id: string;
  nombre: 'supervisor' | 'administrador' | 'secretario';
  permisos: {
    rrhh: {
      ver: boolean;
      agregar: boolean;
      editar: boolean;
      eliminar: boolean;
    };
    planilla: {
      ver: boolean;
      agregar: boolean;
      editar: boolean;
      eliminar: boolean;
    };
    finanzas: {
      ver: boolean;
      agregar: boolean;
      editar: boolean;
      eliminar: boolean;
    };
    vacaciones: {
      ver: boolean;
      agregar: boolean;
      editar: boolean;
      eliminar: boolean;
    };
    incapacidades: {
      ver: boolean;
      agregar: boolean;
      editar: boolean;
      eliminar: boolean;
    };
    configuracion: {
      ver: boolean;
      cambiarLogo: boolean;
      modificarCargas: boolean;
      agregarIncentivos: boolean;
      gestionarUsuarios: boolean;
    };
    pagos: boolean;
    reporteria: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PerfilesService {

  private perfiles: { [key: string]: Perfil } = {
    supervisor: {
      id: 'supervisor',
      nombre: 'supervisor',
      permisos: {
        rrhh: { ver: true, agregar: true, editar: true, eliminar: true },
        planilla: { ver: true, agregar: true, editar: true, eliminar: true },
        finanzas: { ver: true, agregar: true, editar: true, eliminar: true },
        vacaciones: { ver: true, agregar: true, editar: true, eliminar: true },
        incapacidades: { ver: true, agregar: true, editar: true, eliminar: true },
        configuracion: { ver: true, cambiarLogo: true, modificarCargas: true, agregarIncentivos: true, gestionarUsuarios: true },
        pagos: true,
        reporteria: true
      }
    },
    administrador: {
      id: 'administrador',
      nombre: 'administrador',
      permisos: {
        rrhh: { ver: true, agregar: true, editar: true, eliminar: false },
        planilla: { ver: true, agregar: true, editar: false, eliminar: false },
        finanzas: { ver: true, agregar: true, editar: true, eliminar: true },
        vacaciones: { ver: true, agregar: true, editar: false, eliminar: false },
        incapacidades: { ver: true, agregar: true, editar: false, eliminar: false },
        configuracion: { ver: true, cambiarLogo: false, modificarCargas: true, agregarIncentivos: false, gestionarUsuarios: true },
        pagos: false,
        reporteria: true
      }
    },
    secretario: {
      id: 'secretario',
      nombre: 'secretario',
      permisos: {
        rrhh: { ver: true, agregar: false, editar: true, eliminar: false },
        planilla: { ver: true, agregar: false, editar: false, eliminar: false },
        finanzas: { ver: true, agregar: true, editar: true, eliminar: false },
        vacaciones: { ver: true, agregar: true, editar: false, eliminar: false },
        incapacidades: { ver: true, agregar: true, editar: false, eliminar: false },
        configuracion: { ver: false, cambiarLogo: false, modificarCargas: false, agregarIncentivos: false, gestionarUsuarios: false },
        pagos: false,
        reporteria: true
      }
    }
  };

  obtenerPerfil(nombrePerfil: string): Perfil | null {
    return this.perfiles[nombrePerfil] || null;
  }

  obtenerTodos(): Perfil[] {
    return Object.values(this.perfiles);
  }

  tienepermiso(perfil: string, modulo: string, accion: string): boolean {
    const perfilObj = this.perfiles[perfil];
    if (!perfilObj) return false;

    const permisos = perfilObj.permisos as any;
    if (!permisos[modulo]) return false;

    if (typeof permisos[modulo] === 'boolean') {
      return permisos[modulo];
    }

    return permisos[modulo][accion] || false;
  }
}
