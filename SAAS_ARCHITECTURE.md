# 📊 Arquitectura SaaS - Sistema de Transportes RH

## 1. Estrategia de Monetización (Recomendada)

### Modelo Freemium + Premium

#### **Plan Gratuito (Free)**
- ✅ Máximo 5 empleados
- ✅ 1 empresa
- ✅ Acceso básico a módulos (RRHH, Vacaciones)
- ✅ Sin reportes avanzados
- ✅ Sin exportación a Excel
- ❌ Sin módulo de Finanzas
- ❌ Sin análisis de datos
- ❌ Sin soporte prioritario
- **Almacenamiento**: 100 MB
- **Precio**: $0/mes

#### **Plan Professional ($9.99/mes)**
- ✅ Máximo 50 empleados
- ✅ Máximo 3 empresas
- ✅ Todos los módulos básicos
- ✅ Reportes simples
- ✅ Exportación a Excel
- ✅ Historial de 6 meses
- **Almacenamiento**: 2 GB
- **Usuarios administradores**: 3

#### **Plan Business ($29.99/mes)**
- ✅ Máximo 200 empleados
- ✅ Máximo 10 empresas
- ✅ Todos los módulos + avanzados
- ✅ Reportes personalizados
- ✅ Análisis predictivos
- ✅ Historial ilimitado
- ✅ API de integración
- ✅ Soporte por email
- **Almacenamiento**: 10 GB
- **Usuarios administradores**: 10

#### **Plan Enterprise (Personalizado)**
- Contactar a ventas
- Unlimited everything
- Soporte 24/7
- SLA garantizado
- Integraciones personalizadas

---

## 2. Estructura de Base de Datos (Firestore)

### Límites de Firebase:

| Recurso | Límite |
|---------|--------|
| Documentos por colección | Ilimitado |
| Tamaño máximo por documento | 1 MB |
| Escrituras por segundo (por colección) | 1,000 |
| Lecturas por segundo | 24,000 |
| Almacenamiento total | Depende del plan (gratuito: 1 GB, pagado: más) |
| Banda ancha de descarga | 1 GB gratuito/día, luego se cobra |

### Estructura Recomendada:

```
firestore/
├── users/
│   ├── {userId}
│   │   ├── email: string
│   │   ├── nombre: string
│   │   ├── rol: 'admin' | 'supervisor' | 'user'
│   │   ├── empresaId: string (foreign key)
│   │   ├── plan: 'free' | 'professional' | 'business' | 'enterprise'
│   │   ├── estado: 'activo' | 'inactivo' | 'suspendido'
│   │   ├── createdAt: timestamp
│   │   ├── lastLogin: timestamp
│   │   └── permisos: array
│
├── empresas/
│   ├── {empresaId}
│   │   ├── nombre: string
│   │   ├── cedula: string (RUC/RUT)
│   │   ├── plan: 'free' | 'professional' | 'business' | 'enterprise'
│   │   ├── propietarioId: string (userId del dueño)
│   │   ├── estado: 'activa' | 'inactiva' | 'suspendida'
│   │   ├── empleadosCount: number (actualizado en cada insert)
│   │   ├── usuariosCount: number
│   │   ├── almacenamientoUsado: number (en bytes)
│   │   ├── createdAt: timestamp
│   │   └── suscripcion: object
│   │       ├── plan: string
│   │       ├── fechaInicio: timestamp
│   │       ├── fechaVencimiento: timestamp
│   │       ├── metodoPago: 'tarjeta' | 'paypal' | 'transferencia'
│   │       └── estado: 'activa' | 'pendiente' | 'vencida'
│
├── empleados/
│   ├── {empresaId}
│   │   ├── {empleadoId}
│   │   │   ├── nombre: string
│   │   │   ├── cedula: string
│   │   │   ├── puesto: string
│   │   │   ├── salarioBase: number
│   │   │   ├── tipoPago: 'mensual' | 'diario'
│   │   │   ├── estado: 'activo' | 'inactivo'
│   │   │   └── createdAt: timestamp
│
├── planes/
│   ├── free
│   │   ├── nombre: "Plan Gratuito"
│   │   ├── limite_empleados: 5
│   │   ├── limite_empresas: 1
│   │   ├── almacenamiento_mb: 100
│   │   ├── modulos: ['rrhh', 'vacaciones']
│   │   └── precio: 0
│   │
│   ├── professional
│   ├── business
│   └── enterprise
│
├── suscripciones_pagos/
│   ├── {transactionId}
│   │   ├── empresaId: string
│   │   ├── usuarioId: string
│   │   ├── monto: number
│   │   ├── moneda: 'USD' | 'CRC'
│   │   ├── planAnterior: string
│   │   ├── planNuevo: string
│   │   ├── fecha: timestamp
│   │   ├── estado: 'completado' | 'pendiente' | 'fallido'
│   │   ├── metodoPago: string
│   │   └── referencia_pago: string
│
└── auditorias/
    ├── {empresaId}
    │   ├── {logId}
    │   │   ├── usuarioId: string
    │   │   ├── accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN'
    │   │   ├── tabla: string
    │   │   ├── detalles: object
    │   │   ├── timestamp: timestamp
    │   │   └── ipAddress: string
```

---

## 3. Validaciones de Límites por Plan

### En el Frontend:
```typescript
// Validar antes de permitir crear
canCreateEmpleado(empresaId: string): boolean {
  const empresa = this.empresaService.getEmpresa(empresaId);
  const plan = this.planesService.getPlan(empresa.plan);
  const empleadosActuales = this.empleadoService.countByEmpresa(empresaId);
  
  return empleadosActuales < plan.limite_empleados;
}

canAccessModulo(modulo: string, planActual: string): boolean {
  const plan = this.planesService.getPlan(planActual);
  return plan.modulos.includes(modulo);
}
```

### En el Backend (Firestore Rules):
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Solo el propietario puede crear usuarios para su empresa
    match /users/{userId} {
      allow read: if request.auth.uid == userId || 
                     isAdminOfUserEmpresa(request.auth.uid, resource.data.empresaId);
      allow create: if isAdminOfEmpresa(request.auth.uid, request.resource.data.empresaId);
      allow update: if request.auth.uid == userId || 
                       isAdminOfUserEmpresa(request.auth.uid, resource.data.empresaId);
      allow delete: if isAdminOfEmpresa(request.auth.uid, resource.data.empresaId);
    }

    match /empleados/{empresa}/{document=**} {
      allow read: if isUserOfEmpresa(request.auth.uid, empresa);
      allow create: if isAdminOfEmpresa(request.auth.uid, empresa) &&
                       canCreateEmpleado(empresa);
      allow update: if isUserOfEmpresa(request.auth.uid, empresa);
      allow delete: if isAdminOfEmpresa(request.auth.uid, empresa);
    }

    match /auditorias/{empresa}/{document=**} {
      allow create: if isUserOfEmpresa(request.auth.uid, empresa);
      allow read: if isAdminOfEmpresa(request.auth.uid, empresa);
    }
  }
}

function isAdminOfEmpresa(uid, empresaId) {
  return get(/databases/$(database)/documents/empresas/$(empresaId)).data.propietarioId == uid;
}

function isAdminOfUserEmpresa(uid, empresaId) {
  return get(/databases/$(database)/documents/users/$(uid)).data.rol == 'admin' &&
         get(/databases/$(database)/documents/users/$(uid)).data.empresaId == empresaId;
}

function isUserOfEmpresa(uid, empresaId) {
  return get(/databases/$(database)/documents/users/$(uid)).data.empresaId == empresaId;
}

function canCreateEmpleado(empresaId) {
  let empresa = get(/databases/$(database)/documents/empresas/$(empresaId)).data;
  let plan = get(/databases/$(database)/documents/planes/$(empresa.plan)).data;
  return empresa.empleadosCount < plan.limite_empleados;
}
  }
}
```

---

## 4. Gestión de Almacenamiento

### Contar uso de almacenamiento:
```typescript
async calculateStorageUsage(empresaId: string): Promise<number> {
  let totalBytes = 0;
  
  // Contar documentos de empleados
  const empleados = await this.db.collection(`empleados/${empresaId}/datos`).getDocs();
  empleados.docs.forEach(doc => {
    totalBytes += JSON.stringify(doc.data()).length;
  });

  // Contar otros documentos...
  return totalBytes;
}

async checkStorageLimit(empresaId: string): Promise<boolean> {
  const uso = await this.calculateStorageUsage(empresaId);
  const empresa = await this.getEmpresa(empresaId);
  const plan = await this.getPlan(empresa.plan);
  
  return uso < (plan.almacenamiento_mb * 1024 * 1024);
}
```

---

## 5. Integración de Pagos (Recomendado)

### Opciones:
1. **Stripe** (Recomendado para Latinoamérica con Tarjetas)
   - Comisión: 2.9% + $0.30 por transacción
   - Ideal para: Tarjetas de crédito

2. **PayPal**
   - Comisión: 3.49% + $0.49 por transacción
   - Ideal para: Flexibilidad de métodos

3. **Mercado Pago** (Mejor para Latinoamérica)
   - Comisión: 2.99% para transferencias
   - Comisión: 3.99% para tarjetas
   - Ideal para: Empresas en LATAM

4. **Openpay** (Específico para Costa Rica)
   - Integración con bancos locales
   - Mejores comisiones para CRC

---

## 6. Seguridad & Compliance

- ✅ Encriptar contraseñas con bcrypt
- ✅ JWT para sesiones
- ✅ HTTPS en todo
- ✅ Rate limiting en login (prevenir brute force)
- ✅ 2FA opcional para admins
- ✅ Auditoría de todas las acciones
- ✅ GDPR: Permitir descargar/eliminar datos
- ✅ Backups automáticos

---

## 7. Roadmap Recomendado (Fases)

### Fase 1 (Actual): MVP
- [x] Login mejorado
- [ ] Sistema de usuarios en BD
- [ ] Planes básicos (Free/Professional/Business)
- [ ] Validación de límites
- [ ] Auditoría básica

### Fase 2: Monetización
- [ ] Integración con Mercado Pago o Stripe
- [ ] Dashboard de suscripción
- [ ] Facturas automáticas
- [ ] Renovación automática

### Fase 3: Escalabilidad
- [ ] Sistema de notificaciones por email
- [ ] Backups automáticos
- [ ] CDN para assets estáticos
- [ ] Analytics avanzados

### Fase 4: Funcionalidades Premium
- [ ] API REST documentada
- [ ] Webhooks
- [ ] Integraciones con otras plataformas
- [ ] Mobile app

---

## 8. Próximos Pasos Inmediatos

1. Crear colección `users` en Firestore
2. Crear colección `planes` con definiciones
3. Implementar registro/creación de usuarios
4. Agregar validación de límites de plan
5. Sistema de roles y permisos
6. Auditoría de acciones

