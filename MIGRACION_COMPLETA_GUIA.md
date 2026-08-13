# 🔄 Migración Completa de TODOS los Datos

## 📋 ¿Qué se Migra?

```
✅ Empleados
✅ Planillas
✅ Vacaciones
✅ Incapacidades
✅ Finanzas
✅ Configuración
```

Todo se copia de:
- `empresas/3-102-908063/*` → `empresas/empresa123/*` (Transportes D&F)
- `empresas/3-102-753174/*` → `empresas/empresa456/*` (Transportes GyA)

---

## 🚀 Orden de Migración RECOMENDADO

### **Paso 1: Migrar Empresas Base**
```
http://localhost:4200/migracion
Click: "Migrar Empresas a Firestore"
✓ Crea Transportes D&F y GyA en Firestore
```

### **Paso 2: Crear Usuarios de Prueba**
```
http://localhost:4200/crear-usuarios-prueba
Click: "Crear Usuarios de Prueba"
✓ Crea 4 usuarios para poder loguearte
```

### **Paso 3: Migración Completa de Datos**
```
http://localhost:4200/migracion-completa
Click: "Iniciar Migración Completa"
✓ Copia TODOS los datos (empleados, planillas, etc.)
✓ Verás tabla con cantidad de registros migrados
```

### **Paso 4: Loguearte y Verificar**
```
http://localhost:4200/login
Email: admin@transportes-df.com
Contraseña: Admin123456
Empresa: Transportes D&F
✓ Verás todos los empleados migrados
✓ Verás todas las planillas migradas
```

---

## ⚠️ IMPORTANTE ANTES DE MIGRAR

### Checklist Pre-Migración:

- [ ] Verifica que hayas hecho: **Migración de Empresas** (Paso 1)
- [ ] Verifica que hayas hecho: **Crear Usuarios de Prueba** (Paso 2)
- [ ] Ten a mano las nuevas cédulas:
  - Transportes D&F: 3-102-908063
  - Transportes GyA: 3-102-753174

### Durante la Migración:

- ⏳ La migración puede tardar unos segundos
- 🚫 NO cierres la página durante la migración
- 🚫 NO abras la consola (F12)
- ✅ Espera a ver "Migración Completada"

---

## 📊 Qué Esperar al Finalizar

Verás una tabla con:

```
Colección      | D&F   | GyA
---------------|-------|-----
Empleados      | 15    | 20
Planillas      | 45    | 52
Vacaciones     | 8     | 12
Incapacidades  | 3     | 5
Finanzas       | 102   | 87
Configuración  | ✓     | ✓
```

**Total: XXX registros migrados**

---

## 🔍 Verificar Migración en Firebase

### Método 1: Firebase Console
```
1. Ir a https://console.firebase.google.com/
2. Seleccionar "control-transportes"
3. Firestore → empresas → empresa123 (o empresa456)
4. Debería haber subcollecciones:
   ✓ empleados/
   ✓ planillas/
   ✓ vacaciones/
   ✓ incapacidades/
   ✓ finanzas/
   ✓ configuracion/
```

### Método 2: En la Aplicación
```
1. Loguearte con admin@transportes-df.com
2. Ir a cada módulo:
   ✓ RRHH (ver empleados)
   ✓ Planilla (ver planillas)
   ✓ Vacaciones (ver vacaciones)
   ✓ Incapacidades (ver incapacidades)
   ✓ Finanzas (ver datos)
   ✓ Configuración (ver configs)
```

---

## ✅ Validación Post-Migración

Después de migrar, verifica:

- [ ] Empleados visibles en RRHH
- [ ] Planillas generadas correctamente
- [ ] Vacaciones muestran registros
- [ ] Incapacidades muestran registros
- [ ] Finanzas muestra datos
- [ ] Configuración tiene datos

Si algo falta:
1. Verifica que la colección exista en Firebase
2. Verifica que estés logueado con empresa correcta
3. Intenta recargar la página (F5)
4. Abre consola (F12) para ver errores

---

## 🗑️ Después: Datos Antiguos

### Opción A: Mantener como Backup
```
Dejar en: empresas/3-102-908063/
         empresas/3-102-753174/
Uso: Backup por si acaso
```

### Opción B: Eliminar (Cuando estés 100% seguro)
```
1. Firebase Console → Firestore
2. empresas/3-102-908063 → Eliminar colecciones
3. empresas/3-102-753174 → Eliminar colecciones
Ventaja: Menor uso de almacenamiento
```

**RECOMENDACIÓN:** Mantén como backup al menos 1 mes.

---

## 🆘 Si Algo Sale Mal

### Error: "No se encontró empresa XXX"
```
✓ Verifica que completaste Paso 1 (Migración de Empresas)
✓ Verifica que las cédulas sean exactas:
  - 3-102-908063 (D&F)
  - 3-102-753174 (GyA)
```

### Error: "Migración incompleta"
```
✓ Verifica en Firebase Console que existan las colecciones
✓ Verifica con usuarios de prueba que datos estén ahí
✓ Intenta nuevamente (puede haber timeout)
```

### Falta Información en Módulos
```
✓ Recarga la página (F5)
✓ Cierra sesión y vuelve a loguearte
✓ Verifica que estés en empresa correcta (dropdown)
✓ Abre consola (F12) para ver errores
```

---

## 📝 Resumen Rápido

```
Migración de Empresas:      ✓ http://localhost:4200/migracion
Crear Usuarios:             ✓ http://localhost:4200/crear-usuarios-prueba
Migración Completa:         ✓ http://localhost:4200/migracion-completa
Login:                      ✓ http://localhost:4200/login
Verificar (RRHH):           ✓ http://localhost:4200/rrhh
```

**Listo para usar después de completar estos pasos.**

