# 🔄 Migración de Empresas Hardcodeadas a Firebase

## ¿Por qué hacer esto?

Las empresas "Transportes D&F" y "Transportes GyA" estaban hardcodeadas en el código. Ahora necesitamos migrarlas a Firestore para que:
- Aparezcan en el dropdown de login
- Tengan propietario definido
- Puedan tener usuarios asociados
- Funcionen con el sistema de suscripciones

---

## 📋 Paso a Paso

### 1. Acceder a la página de migración

```
http://localhost:4200/migracion
```

### 2. Click en "Migrar Empresas a Firestore"

Esto insertará:
```
Empresa 1:
- Nombre: "Transportes D&F"
- Cédula: "3-102-908063"
- Plan: "professional"
- Propietario: "admin-legacy" (temporal)

Empresa 2:
- Nombre: "Transportes GyA"
- Cédula: "3-102-753174"
- Plan: "professional"
- Propietario: "admin-legacy" (temporal)
```

### 3. Verificar en Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto "control-transportes"
3. Firestore → Colección "empresas"
4. Debería ver 2 documentos nuevos

---

## 👤 Asignar Propietarios Reales (Opcional)

Si quieres que tengan propietarios reales en lugar de "admin-legacy":

### Opción A: Crear usuarios administradores

```
Email: admin-transportes-df@email.com
Contraseña: AdminPass123
Rol: admin
Empresa: Transportes D&F
```

Luego cambiar en Firestore:
```
empresas/empresa123
{
  propietarioId: "uid-real-del-admin"  ← En lugar de "admin-legacy"
}
```

### Opción B: Dejar como está

Puedes dejar `propietarioId: "admin-legacy"` temporalmente. Esto significa:
- Las empresas existen en Firestore
- Aparecen en el dropdown de login
- Cualquier usuario puede registrarse para trabajar en esas empresas
- No hay "propietario" específico (útil para empresas multiusuario)

---

## ✅ Verificación Post-Migración

Después de hacer click en "Migrar Empresas":

1. ✅ Aparecerá mensaje: "Migración completada exitosamente!"
2. ✅ En Firestore verás 2 empresas nuevas
3. ✅ Cuando hagas login, las 2 empresas aparecerán en el dropdown
4. ✅ Podrás seleccionar cualquiera de las 3 (2 migradas + 1 nueva que registres)

---

## 🔐 Datos Migrados

### Antes (Hardcodeado):
```typescript
empresas = [
  { nombre: 'Transportes D&F', cedula: '3-102-908063' },
  { nombre: 'Transportes GyA', cedula: '3-102-753174' }
]
```

### Después (Firestore):
```
firestore/
  empresas/
    - doc1: { nombre: "Transportes D&F", cedula: "3-102-908063", ... }
    - doc2: { nombre: "Transportes GyA", cedula: "3-102-753174", ... }
```

---

## 🗑️ Después: Limpiar el Código

Una vez migrado, puedes:

1. ❌ Eliminar la página de migración (no la necesitas más)
2. ❌ Eliminar la ruta `/migracion` 
3. ✅ Mantener solo las empresas en Firestore

Para eliminar:
```bash
# Borrar archivo
rm src/app/shared/migracion/migracion.component.ts

# Quitar ruta de app-routing.module.ts
{ path: 'migracion', component: MigracionComponent },  ← Eliminar

# Quitar import de app.module.ts
import { MigracionComponent } from './shared/migracion/migracion.component';  ← Eliminar
MigracionComponent,  ← Eliminar de declarations
```

---

## ❓ Preguntas Comunes

**P: ¿Perderé los datos de empleados si hago esto?**
R: No. Solo estamos migrando las empresas. Los empleados seguirán donde están.

**P: ¿Puedo hacer la migración más de una vez?**
R: Sí, pero crearás duplicados. Mejor hacerlo una sola vez.

**P: ¿Qué pasa con "admin-legacy"?**
R: Es solo un ID temporal. Puedes asignar usuarios reales después.

**P: ¿Las empresas migradas tendrán suscripción?**
R: Sí, plan "professional" con suscripción activa por 1 año.

---

## 🎯 Estado Final

✅ 3 empresas activas en Firestore:
1. Transportes D&F (migrada)
2. Transportes GyA (migrada)
3. Tu nueva empresa (si registraste)

✅ Todas aparecen en el dropdown de login

✅ Puedes crear usuarios para cualquiera de ellas

---

