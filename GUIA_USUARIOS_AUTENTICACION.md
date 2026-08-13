# 👤 Guía: Usuarios y Autenticación

## 🔄 Flujo de Registro

### Cuando un nuevo usuario se registra:

1. **Ingresa datos:**
   - Nombre completo: "Juan Pérez"
   - Email: "juan@email.com" ← **ESTO es lo que usa para LOGIN**
   - Contraseña: "MiPassword123"
   - Nombre empresa: "Mi Empresa"
   - Cédula empresa: "3-123-456789"
   - Plan: "Free"

2. **Se crean 2 registros en Firebase:**

   **A) En Firebase Authentication:**
   ```
   Email: juan@email.com
   Password: (encriptada y segura)
   UID: Auto-generado (ej: "abc123xyz")
   ```

   **B) En Firestore:**
   ```
   Colección: empresas/
   {
     id: "empresa123",
     nombre: "Mi Empresa",
     cedula: "3-123-456789",
     propietarioId: "abc123xyz",  ← UID del usuario
     plan: "free",
     empleadosCount: 0,
     usuariosCount: 1
   }

   Colección: users/
   {
     uid: "abc123xyz",
     email: "juan@email.com",
     nombre: "Juan Pérez",
     empresaId: "empresa123",   ← ID de la empresa
     rol: "admin",              ← Es admin de su empresa
     permisos: [array de permisos],
     estado: "activo"
   }
   ```

---

## 🔑 Cómo Loguearse

### Para el usuario que se registró:

**Email:** `juan@email.com` ← **El que registró**
**Contraseña:** `MiPassword123`
**Empresa:** Selecciona "Mi Empresa" del dropdown

---

## 👥 Crear Más Usuarios en la Misma Empresa

### El admin (Juan) quiere agregar más usuarios:

1. Va a módulo "Gestión de Usuarios"
2. Click en "Nuevo Usuario"
3. Ingresa:
   - Email: "maria@email.com"
   - Contraseña temporal: "TemporalPass123"
   - Nombre: "María García"
   - Rol: "Supervisor"

4. **Se crea:**
   ```
   Firebase Auth:
   Email: maria@email.com
   Password: TemporalPass123
   
   Firestore users/:
   {
     uid: "maria456xyz",
     email: "maria@email.com",
     nombre: "María García",
     empresaId: "empresa123",  ← MISMA empresa que Juan
     rol: "supervisor",
     estado: "activo"
   }
   ```

5. **María se loguea con:**
   - Email: `maria@email.com`
   - Contraseña: `TemporalPass123`
   - Empresa: "Mi Empresa" (la misma que Juan)

---

## 🏢 Multi-Empresa: Un Usuario en Varias Empresas

### Si Juan es propietario de 2 empresas:

```
Empresa 1: "Mi Empresa" (propietario: juan@email.com)
Empresa 2: "Otra Empresa" (propietario: juan@email.com)
```

**En Firestore:**
```
users/abc123xyz (Juan)
{
  uid: "abc123xyz",
  email: "juan@email.com",
  nombre: "Juan Pérez",
  empresaId: "empresa123",  ← Pero esto solo guarda 1 empresa
  rol: "admin"
}
```

❌ **PROBLEMA:** Actualmente el usuario solo está en UNA empresa

✅ **SOLUCIÓN FUTURA:** 
Cambiar estructura a:
```
users/abc123xyz
{
  uid: "abc123xyz",
  email: "juan@email.com",
  nombre: "Juan Pérez",
  empresas: [
    { id: "empresa123", rol: "admin" },
    { id: "empresa456", rol: "admin" }
  ]
}
```

---

## 🔐 Resumen Rápido

| Concepto | Explicación | Ejemplo |
|----------|-------------|---------|
| **Email** | Lo que usas para LOGIN | juan@email.com |
| **UID** | ID único en Firebase Auth | abc123xyz |
| **empresaId** | La empresa del usuario | empresa123 |
| **Rol** | Permisos del usuario | admin/supervisor/user |
| **Contraseña** | Encriptada en Firebase Auth | Solo visible al usuario |

---

## 📊 Estado de Usuarios y Empresas

### Estados posibles:

```
Usuarios:
- activo: Puede acceder
- inactivo: No puede acceder (admin lo desactivó)
- suspendido: Cuenta pausada (falta pago)

Empresas:
- activa: Funciona normalmente
- inactiva: Registrada pero sin usar
- suspendida: Vencida suscripción
```

---

## 🔄 Migración de Empresas Legales

### Para migrar "Transportes D&F" y "Transportes GyA" a Firebase:

1. Navegar a: `http://localhost:4200/migracion`
2. Click en "Migrar Empresas a Firestore"
3. ✅ Aparecerán en el dropdown de login

**Nota:** Cambiar `propietarioId: 'admin-legacy'` a un usuario real después si es necesario.

---

## 📝 Para Recordar

✅ **Email = Credencial de login**
✅ **UID = Identificador en Firebase Auth**
✅ **empresaId = Dónde trabaja el usuario**
✅ **Rol = Qué puede hacer el usuario**
✅ **Contraseña = Segura en Firebase Auth (nunca en BD)**

