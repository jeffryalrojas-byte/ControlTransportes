export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'supervisor' | 'user';
  empresaId: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  createdAt: Date;
  lastLogin?: Date;
  permisos: string[];
}

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

export const PERMISOS_POR_ROL: { [key: string]: string[] } = {
  admin: [
    'crear_usuario',
    'eliminar_usuario',
    'editar_usuario',
    'ver_usuarios',
    'crear_empleado',
    'editar_empleado',
    'eliminar_empleado',
    'ver_empleados',
    'crear_empresa',
    'editar_empresa',
    'ver_empresa',
    'ver_finanzas',
    'ver_reportes',
    'gestionar_suscripcion'
  ],
  supervisor: [
    'crear_empleado',
    'editar_empleado',
    'eliminar_empleado',
    'ver_empleados',
    'ver_finanzas',
    'ver_reportes',
    'crear_planilla',
    'editar_planilla'
  ],
  user: [
    'ver_empleados',
    'ver_datos_propios'
  ]
};
