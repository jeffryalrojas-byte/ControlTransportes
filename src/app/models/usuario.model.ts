/**
 * MODELO DE AUTENTICACIÓN Y PERMISOS
 * 
 * Terminología: PERFIL (único en todo el código)
 * 
 * Estructura:
 * - Usuario tiene UN perfil
 * - Perfil tiene MUCHOS permisos
 * - Permisos son strings individuales (ej: "crear_empleado", "eliminar_empleado", etc)
 */

// ============= USUARIO =============
export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  perfil: string;  // ID del perfil (ej: "supervisor", "administrador", "secretario")
  empresaId: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  createdAt: Date;
  lastLogin?: Date;
}

// ============= PERFIL =============
export interface Perfil {
  id: string;                    // Unique ID (ej: "supervisor", "custom_role_1")
  nombre: string;                // Display name (ej: "Supervisor", "Gerente de RRHH")
  descripcion: string;           // Descripción del perfil
  permisos: string[];            // Array de permisos (ej: ["crear_empleado", "ver_finanzas", ...])
  esDefault: boolean;            // Si es uno de los 3 perfiles por defecto
  empresaId: string;             // ID de empresa que lo creó (null para globales)
  createdAt: Date;
  updatedAt: Date;
}

// ============= PERMISOS DISPONIBLES =============
export const PERMISOS_DISPONIBLES = {
  // RRHH
  'ver_empleados': 'Ver listado de empleados',
  'crear_empleado': 'Crear empleado',
  'editar_empleado': 'Editar datos de empleado',
  'eliminar_empleado': 'Eliminar empleado',
  'ver_datos_empleado': 'Ver detalles de empleado',

  // PLANILLA
  'ver_planilla': 'Ver planilla',
  'crear_planilla': 'Crear planilla',
  'editar_planilla': 'Editar planilla',
  'eliminar_planilla': 'Eliminar planilla',
  'generar_planilla': 'Generar planilla',

  // FINANZAS
  'ver_finanzas': 'Ver módulo de finanzas',
  'crear_finanza': 'Crear registro financiero',
  'editar_finanza': 'Editar registro financiero',
  'eliminar_finanza': 'Eliminar registro financiero',
  'ver_reportes_finanzas': 'Ver reportes financieros',

  // VACACIONES
  'ver_vacaciones': 'Ver vacaciones',
  'solicitar_vacaciones': 'Solicitar vacaciones',
  'aprobar_vacaciones': 'Aprobar solicitudes de vacaciones',
  'rechazar_vacaciones': 'Rechazar solicitudes de vacaciones',
  'editar_vacaciones': 'Editar vacaciones',
  'eliminar_vacaciones': 'Eliminar vacaciones',

  // INCAPACIDADES/PERMISOS
  'ver_incapacidades': 'Ver incapacidades',
  'solicitar_incapacidad': 'Solicitar incapacidad',
  'aprobar_incapacidad': 'Aprobar incapacidades',
  'rechazar_incapacidad': 'Rechazar incapacidades',
  'editar_incapacidad': 'Editar incapacidades',
  'eliminar_incapacidad': 'Eliminar incapacidades',

  // CONFIGURACIÓN
  'ver_configuracion': 'Ver módulo de configuración',
  'editar_logo': 'Editar logo de empresa',
  'editar_cargas_sociales': 'Editar cargas sociales',
  'agregar_incentivos': 'Agregar incentivos',
  'gestionar_usuarios': 'Gestionar usuarios',
  'gestionar_perfiles': 'Gestionar perfiles y permisos',

  // PAGOS
  'ver_pagos': 'Ver módulo de pagos',
  'procesar_pago': 'Procesar pagos',

  // REPORTERÍA
  'ver_reporteria': 'Ver reportería y auditoría',
  'exportar_reportes': 'Exportar reportes',
};

// ============= PERFILES POR DEFECTO =============
export const PERFILES_DEFAULT: { [key: string]: Perfil } = {
  supervisor: {
    id: 'supervisor',
    nombre: 'Supervisor',
    descripcion: 'Acceso total a todos los módulos',
    esDefault: true,
    empresaId: '',
    permisos: [
      // RRHH - Total
      'ver_empleados', 'crear_empleado', 'editar_empleado', 'eliminar_empleado', 'ver_datos_empleado',
      // PLANILLA - Total
      'ver_planilla', 'crear_planilla', 'editar_planilla', 'eliminar_planilla', 'generar_planilla',
      // FINANZAS - Total
      'ver_finanzas', 'crear_finanza', 'editar_finanza', 'eliminar_finanza', 'ver_reportes_finanzas',
      // VACACIONES - Total
      'ver_vacaciones', 'solicitar_vacaciones', 'aprobar_vacaciones', 'rechazar_vacaciones', 'editar_vacaciones', 'eliminar_vacaciones',
      // INCAPACIDADES - Total
      'ver_incapacidades', 'solicitar_incapacidad', 'aprobar_incapacidad', 'rechazar_incapacidad', 'editar_incapacidad', 'eliminar_incapacidad',
      // CONFIGURACIÓN - Total
      'ver_configuracion', 'editar_logo', 'editar_cargas_sociales', 'agregar_incentivos', 'gestionar_usuarios', 'gestionar_perfiles',
      // PAGOS - Total
      'ver_pagos', 'procesar_pago',
      // REPORTERÍA - Total
      'ver_reporteria', 'exportar_reportes',
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  administrador: {
    id: 'administrador',
    nombre: 'Administrador',
    descripcion: 'Acceso a la mayoría de módulos con restricciones de eliminación',
    esDefault: true,
    empresaId: '',
    permisos: [
      // RRHH - Sin eliminar
      'ver_empleados', 'crear_empleado', 'editar_empleado', 'ver_datos_empleado',
      // PLANILLA - Sin eliminar
      'ver_planilla', 'crear_planilla', 'editar_planilla', 'generar_planilla',
      // FINANZAS - Total
      'ver_finanzas', 'crear_finanza', 'editar_finanza', 'eliminar_finanza', 'ver_reportes_finanzas',
      // VACACIONES - Sin eliminar
      'ver_vacaciones', 'solicitar_vacaciones', 'aprobar_vacaciones', 'rechazar_vacaciones',
      // INCAPACIDADES - Sin eliminar
      'ver_incapacidades', 'solicitar_incapacidad', 'aprobar_incapacidad', 'rechazar_incapacidad',
      // CONFIGURACIÓN - Sin gestionar perfiles
      'ver_configuracion', 'editar_cargas_sociales', 'agregar_incentivos', 'gestionar_usuarios',
      // PAGOS - No
      // REPORTERÍA
      'ver_reporteria', 'exportar_reportes',
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  secretario: {
    id: 'secretario',
    nombre: 'Secretario',
    descripcion: 'Acceso limitado, principalmente visualización y solicitudes',
    esDefault: true,
    empresaId: '',
    permisos: [
      // RRHH - Solo ver
      'ver_empleados', 'ver_datos_empleado',
      // PLANILLA - Solo ver
      'ver_planilla',
      // FINANZAS - Ver
      'ver_finanzas', 'ver_reportes_finanzas',
      // VACACIONES - Solicitar y ver
      'ver_vacaciones', 'solicitar_vacaciones',
      // INCAPACIDADES - Solicitar y ver
      'ver_incapacidades', 'solicitar_incapacidad',
      // CONFIGURACIÓN - No
      // PAGOS - No
      // REPORTERÍA
      'ver_reporteria',
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// ============= EMPRESA =============
export interface Empresa {
  id: string;
  nombre: string;
  cedula: string;
  plan: 'free' | 'professional' | 'business' | 'enterprise';
  propietarioId: string;
  estado: 'activa' | 'inactiva' | 'suspendida';
  empleadosCount: number;
  usuariosCount: number;
  almacenamientoUsado: number;
  createdAt: Date;
  suscripcion: {
    plan: string;
    fechaInicio: Date;
    fechaVencimiento: Date;
    metodoPago: 'tarjeta' | 'paypal' | 'transferencia';
    estado: 'activa' | 'pendiente' | 'vencida';
  };
}

export interface Plan {
  id: 'free' | 'professional' | 'business' | 'enterprise';
  nombre: string;
  precio: number;
  limite_empleados: number;
  limite_empresas: number;
  almacenamiento_mb: number;
  modulos: string[];
  usuariosAdministradores: number;
}

export const PLANES_DISPONIBLES: { [key: string]: Plan } = {
  free: {
    id: 'free',
    nombre: 'Plan Gratuito',
    precio: 0,
    limite_empleados: 2,
    limite_empresas: 1,
    almacenamiento_mb: 100,
    modulos: ['rrhh', 'vacaciones'],
    usuariosAdministradores: 1
  },
  professional: {
    id: 'professional',
    nombre: 'Plan Professional',
    precio: 19.99,
    limite_empleados: 20,
    limite_empresas: 3,
    almacenamiento_mb: 2048,
    modulos: ['rrhh', 'vacaciones', 'incapacidades', 'planilla'],
    usuariosAdministradores: 3
  },
  business: {
    id: 'business',
    nombre: 'Plan Business',
    precio: 39.99,
    limite_empleados: 200,
    limite_empresas: 10,
    almacenamiento_mb: 10240,
    modulos: ['rrhh', 'vacaciones', 'incapacidades', 'planilla', 'finanzas', 'configuracion'],
    usuariosAdministradores: 10
  },
  enterprise: {
    id: 'enterprise',
    nombre: 'Plan Enterprise',
    precio: 0,
    limite_empleados: 999999,
    limite_empresas: 999999,
    almacenamiento_mb: 999999,
    modulos: ['rrhh', 'vacaciones', 'incapacidades', 'planilla', 'finanzas', 'configuracion', 'reportes', 'api'],
    usuariosAdministradores: 999
  }
};
