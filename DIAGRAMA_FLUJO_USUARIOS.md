# 🔄 Diagrama de Flujo: Usuarios y Empresas

## 📊 Flujo de Registro

```
┌─────────────────────────────────────────────────────┐
│ Usuario llena formulario de registro                 │
│ • Nombre: Juan Pérez                                │
│ • Email: juan@email.com ← CREDENCIAL                │
│ • Contraseña: Pass123                               │
│ • Empresa: Mi Empresa                               │
│ • Cédula: 3-123-456789                              │
│ • Plan: Free                                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Se crea en Firebase Authentication                  │
│ • Email: juan@email.com                             │
│ • Password: [encriptada]                            │
│ • UID: abc123xyz                                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Se crea Empresa en Firestore                        │
│ Colección: empresas/                                │
│ Documento: empresa123                               │
│ • nombre: "Mi Empresa"                              │
│ • cedula: "3-123-456789"                            │
│ • propietarioId: "abc123xyz"                        │
│ • plan: "free"                                      │
│ • estado: "activa"                                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Se crea Usuario en Firestore                        │
│ Colección: users/                                   │
│ Documento: abc123xyz                                │
│ • uid: "abc123xyz"                                  │
│ • email: "juan@email.com"                           │
│ • nombre: "Juan Pérez"                              │
│ • empresaId: "empresa123"                           │
│ • rol: "admin" ← Es admin de su empresa             │
│ • estado: "activo"                                  │
│ • permisos: [...]                                   │
└─────────────────────────────────────────────────────┘
                        ↓
           ✅ Redirigir a /rrhh
```

---

## 🔐 Flujo de Login

```
┌─────────────────────────────────────────────────────┐
│ Usuario va a /login                                 │
│ Carga empresas activas de Firebase                  │
│ • Transportes D&F (migrada)                         │
│ • Transportes GyA (migrada)                         │
│ • Mi Empresa (registrada)                           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Usuario ingresa:                                    │
│ • Email: juan@email.com ← IMPORTANTE               │
│ • Contraseña: Pass123                               │
│ • Empresa: "Mi Empresa" (selecciona del dropdown)   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Firebase Auth valida email + contraseña             │
│ ✅ Credenciales correctas                           │
│ Retorna: UID abc123xyz                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Obtener datos del usuario de Firestore              │
│ users/abc123xyz                                     │
│ {                                                   │
│   uid: "abc123xyz",                                 │
│   email: "juan@email.com",                          │
│   empresaId: "empresa123",                          │
│   rol: "admin"                                      │
│ }                                                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Validaciones:                                       │
│ ✅ Usuario existe en Firestore                      │
│ ✅ Pertenece a empresa "empresa123"                 │
│ ✅ Estado = "activo"                                │
│ ✅ Puede acceder                                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Guardar en localStorage:                            │
│ • usuarioActivo: { uid, email, rol, empresaId }   │
│ • empresaActiva: "empresa123"                       │
│ • Actualizar lastLogin en Firestore                 │
└─────────────────────────────────────────────────────┘
                        ↓
           ✅ Redirigir a /rrhh
           Usuario ve sus datos de la empresa
```

---

## 🏢 Estructura de Datos en Firestore

```
firestore/
│
├─ empresas/
│  ├─ empresa123
│  │  ├─ nombre: "Mi Empresa"
│  │  ├─ cedula: "3-123-456789"
│  │  ├─ propietarioId: "abc123xyz"
│  │  ├─ plan: "free"
│  │  ├─ estado: "activa"
│  │  └─ suscripcion: {...}
│  │
│  ├─ empresa456
│  │  └─ (Transportes D&F - migrada)
│  │
│  └─ empresa789
│     └─ (Transportes GyA - migrada)
│
├─ users/
│  ├─ abc123xyz
│  │  ├─ uid: "abc123xyz"
│  │  ├─ email: "juan@email.com"
│  │  ├─ nombre: "Juan Pérez"
│  │  ├─ empresaId: "empresa123"
│  │  ├─ rol: "admin"
│  │  ├─ permisos: [...]
│  │  └─ estado: "activo"
│  │
│  └─ def456xyz
│     ├─ (Otros usuarios de la empresa)
│
├─ planes/
│  ├─ free → { limite_empleados: 5, ... }
│  ├─ professional → { limite_empleados: 50, ... }
│  ├─ business → { limite_empleados: 200, ... }
│  └─ enterprise → { limite_empleados: 999999, ... }
│
└─ empleados/
   └─ empresa123/
      ├─ emp1 → { nombre, cedula, puesto, ... }
      └─ emp2 → { nombre, cedula, puesto, ... }
```

---

## 🔑 Relación entre Tablas

```
┌──────────────┐
│  Firebase    │
│     Auth     │
├──────────────┤
│ Email: juan@ │  ← Email es la credencial
│ Pass: [enc]  │
│ UID: abc123  │
└──────────────┘
       │
       │ (UID)
       ↓
┌──────────────┐
│    users/    │
│  abc123xyz   │ ← Aquí está con email, empresaId, rol
├──────────────┤
│ empresaId:   │─────┐
│ empresa123   │     │
└──────────────┘     │
                     │ (empresaId)
                     ↓
            ┌──────────────┐
            │  empresas/   │
            │ empresa123   │ ← Aquí está la empresa
            ├──────────────┤
            │ nombre:      │
            │ plan:        │
            │ estado:      │
            └──────────────┘
```

---

## 📱 Tabla Comparativa: Antes vs Después

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| **Empresas** | Hardcodeadas en código | En Firestore (dinámicas) |
| **Usuarios** | En código (admin/super) | En Firestore (infinitos) |
| **Login** | Valores fijos | Email + Contraseña |
| **Roles** | 2 fijos (admin/super) | Ilimitados |
| **Permisos** | En código | En Firestore (actualizables) |
| **Multi-empresa** | ❌ No | ⚠️ Próximamente |
| **Suscripción** | ❌ No | ✅ Sí |

---

## 🔄 Migración: Empresas Hardcodeadas → Firebase

```
ANTES:
┌─────────────────────────────────────┐
│ login.component.ts                  │
│ empresas = [                        │
│   { nombre: 'D&F', cedula: '...' }, │
│   { nombre: 'GyA', cedula: '...' }  │
│ ]                                   │
└─────────────────────────────────────┘

DESPUÉS:
┌─────────────────────────────────────┐
│ migracion.component.ts              │
│ Click "Migrar"                      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Firestore empresas/                 │
│ • empresa456 (D&F)                  │
│ • empresa789 (GyA)                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Login carga de Firebase              │
│ empresas.length = 3 (2 + 1 nueva)    │
└─────────────────────────────────────┘
```

---

## ✅ Checklist: Qué está Listo

- ✅ Autenticación con Firebase Auth (email + password)
- ✅ Usuarios en Firestore con roles y permisos
- ✅ Empresas dinámicas desde Firestore
- ✅ Componente de migración para empresas legacy
- ✅ Validación de pertenencia a empresa
- ✅ Dropdown de login carga en tiempo real
- ✅ Nuevo usuario se crea como admin automáticamente
- ✅ Logout limpia sesión

---

## 🎯 Próximos Pasos

1. **Migrar empresas:**
   ```
   http://localhost:4200/migracion
   ```

2. **Probar completo:**
   - Registrarse
   - Migrar empresas
   - Loguearse con ambas

3. **Multi-empresa:**
   - Cambiar estructura de Firestore
   - Permitir usuario en varias empresas

