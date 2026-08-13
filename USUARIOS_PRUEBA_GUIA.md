# 🔑 Usuarios de Prueba para Empresas Migradas

## ❓ ¿Por qué el botón de login no funciona?

El formulario requiere que **TODOS los campos sean válidos:**
- ✅ Email válido
- ✅ Contraseña (mín 6 caracteres)
- ✅ Empresa seleccionada
- ✅ El usuario debe existir en Firebase Auth + Firestore

**Problema:** Las empresas migradas (D&F y GyA) **NO TIENEN USUARIOS** asociados.

---

## 📋 Solución: Crear Usuarios de Prueba

### Paso 1: Ir a la página de creación de usuarios

```
http://localhost:4200/crear-usuarios-prueba
```

### Paso 2: Click en "Crear Usuarios de Prueba"

Esto crea automáticamente **4 usuarios de prueba:**

```
1. admin@transportes-df.com
   Contraseña: Admin123456
   Empresa: Transportes D&F
   Rol: admin

2. supervisor@transportes-df.com
   Contraseña: Super123456
   Empresa: Transportes D&F
   Rol: supervisor

3. admin@transportes-gya.com
   Contraseña: Admin123456
   Empresa: Transportes GyA
   Rol: admin

4. supervisor@transportes-gya.com
   Contraseña: Super123456
   Empresa: Transportes GyA
   Rol: supervisor
```

### Paso 3: Copiar los datos y loguearte

**Para Transportes D&F:**
```
Email: admin@transportes-df.com
Contraseña: Admin123456
Empresa: Transportes D&F
```

**Para Transportes GyA:**
```
Email: admin@transportes-gya.com
Contraseña: Admin123456
Empresa: Transportes GyA
```

---

## 🔄 Flujo Completo

```
1. Migrar empresas
   http://localhost:4200/migracion
   ↓
2. Crear usuarios de prueba
   http://localhost:4200/crear-usuarios-prueba
   ↓
3. Loguearse
   http://localhost:4200/login
   Email + Contraseña + Empresa
```

---

## ✅ Para tu Empresa de Prueba (EmpresaPrueba)

Tu correo `jeffryalrojas@gmail.com` **NO EXISTE** en Firebase.

**Opciones:**

### Opción A: Registrarse nuevamente
1. Ir a `/registro`
2. Llenar con datos nuevos
3. Crear empresa "EmpresaPrueba"
4. Te creas como admin automáticamente

### Opción B: Usar las empresas migradas
1. Crear usuarios de prueba
2. Loguearte con uno de los 4 usuarios creados

---

## 🚨 Por qué falla el login

### Error 1: Campo Empresa vacío
```
Email: ✅ jeffryalrojas@gmail.com
Contraseña: ✅ ••••••
Empresa: ❌ Vacío o sin seleccionar
```
**Solución:** Seleccionar una empresa del dropdown

### Error 2: Usuario no existe en Firebase
```
Email: jeffryalrojas@gmail.com (nunca se registró)
Firebase Auth: ❌ No existe
```
**Solución:** Registrarse en `/registro` o crear usuarios de prueba

### Error 3: Usuario no pertenece a empresa seleccionada
```
Usuario: jeffryalrojas@gmail.com (existe)
Pero: empresaId = "empresa123"
Selecciona: "Transportes D&F" (empresaId = "empresa456")
Firebase: ❌ No coinciden
```
**Solución:** Seleccionar empresa correcta o crear usuario para esa empresa

---

## 📊 Resumen: Dónde Loguearse

### Opción 1: Usar Usuarios de Prueba (RECOMENDADO)
```
http://localhost:4200/crear-usuarios-prueba
↓
admin@transportes-df.com / Admin123456 / Transportes D&F
```

### Opción 2: Registrarse Nueva Empresa
```
http://localhost:4200/registro
↓
Llenar datos + Crear empresa
↓
Tu correo / Tu contraseña / Tu empresa
```

### Opción 3: Usar Empresa Registrada Anteriormente
```
Si ya tienes usuario en una empresa:
http://localhost:4200/login
↓
Tu email / Tu contraseña / Seleccionar empresa
```

---

## 🎯 Checklist

- [ ] Migrar empresas: `http://localhost:4200/migracion`
- [ ] Crear usuarios de prueba: `http://localhost:4200/crear-usuarios-prueba`
- [ ] Copiar uno de los 4 usuarios
- [ ] Loguearte: `http://localhost:4200/login`
- [ ] ✅ Deberías acceder al dashboard

---

## ⚙️ Después: Limpiar

Una vez que todo funcione, puedes eliminar estas herramientas:
- `http://localhost:4200/migracion` - Solo para migración
- `http://localhost:4200/crear-usuarios-prueba` - Solo para pruebas

Pero por ahora déjalas para futuras pruebas.

