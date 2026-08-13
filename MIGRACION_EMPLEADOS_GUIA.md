# 🔄 Migración de Empleados de Empresas Antiguas a Nuevas

## ❓ ¿Cuál es el problema?

Tienes datos de empleados en 2 estructuras diferentes:

### Estructura Antigua (por cédula):
```
empresas/
├─ 3-102-908063/
│  └─ empleados/
│     ├─ emp1 { nombre: "Juan", ... }
│     ├─ emp2 { nombre: "María", ... }
│     └─ ...
│
└─ 3-102-753174/
   └─ empleados/
      ├─ emp1 { nombre: "Carlos", ... }
      └─ ...
```

### Estructura Nueva (por ID de empresa):
```
empresas/
├─ empresa123 (Transportes D&F)
│  └─ empleados/ (vacío)
│
└─ empresa456 (Transportes GyA)
   └─ empleados/ (vacío)
```

**Necesitas:** Copiar empleados de la estructura antigua a la nueva.

---

## ✅ Solución: Migración Automática

### Paso 1: Ir a la página de migración de empleados

```
http://localhost:4200/migrar-empleados
```

### Paso 2: Click en "Migrar Empleados"

Esto automáticamente:
1. Obtiene todas las empresas nuevas por nombre
2. Lee los empleados de `empresas/3-102-908063/empleados/`
3. Los copia a `empresas/empresa123/empleados/` (Transportes D&F)
4. Lee los empleados de `empresas/3-102-753174/empleados/`
5. Los copia a `empresas/empresa456/empleados/` (Transportes GyA)
6. Actualiza el `empresaId` de cada empleado a la nueva empresa

### Paso 3: Verificar en Firebase

```
Firestore Console
├─ empresas/
│  ├─ empresa123/
│  │  └─ empleados/
│  │     ├─ emp1 { nombre: "Juan", empresaId: "empresa123" }
│  │     └─ emp2 { nombre: "María", empresaId: "empresa123" }
│  │
│  └─ empresa456/
│     └─ empleados/
│        ├─ emp1 { nombre: "Carlos", empresaId: "empresa456" }
│        └─ ...
```

---

## 🔄 Orden Completo de Migración

```
1. Migrar Empresas
   http://localhost:4200/migracion
   ✓ Crea empresas D&F y GyA en Firestore

2. Crear Usuarios de Prueba
   http://localhost:4200/crear-usuarios-prueba
   ✓ Crea 4 usuarios para login

3. Migrar Empleados ← NUEVO
   http://localhost:4200/migrar-empleados
   ✓ Copia empleados a nuevas empresas

4. Login y Verificar
   http://localhost:4200/login
   ✓ Loguearte y ver empleados
```

---

## 📊 Qué se Migra

### De Empleado:
- ✅ ID
- ✅ Nombre
- ✅ Cédula
- ✅ Puesto
- ✅ Fecha Ingreso
- ✅ Tipo Pago (mensual/diario)
- ✅ Salario
- ✅ Tipo Contrato
- ✅ Fecha Fin Contrato
- ✅ empresaId ← Actualizado a nuevo ID

### No se migran:
- ❌ Datos de Planilla (tablas separadas)
- ❌ Vacaciones
- ❌ Incapacidades

**Nota:** Si necesitas migrar esos datos, hay que hacerlo por separado.

---

## ⚠️ Consideraciones

### 1. **¿Qué pasa con los datos antiguos?**
No se eliminan. Quedan en:
- `empresas/3-102-908063/empleados/`
- `empresas/3-102-753174/empleados/`

Puedes eliminarlos después si lo deseas.

### 2. **¿Puedo hacer la migración más de una vez?**
Sí, pero cuidado: creará duplicados.

Mejor hacer una sola vez y luego eliminar la ruta `/migrar-empleados`.

### 3. **¿Y si hay empleados con mismo ID?**
Se sobrescriben. La migración usa el mismo ID de documento.

---

## 🎯 Después de Migrar

1. ✅ Loguearte con `admin@transportes-df.com / Admin123456`
2. ✅ Ver empleados en /rrhh
3. ✅ Debería mostrar todos los empleados migrados
4. ✅ Poder crear nuevos empleados
5. ✅ Generar planillas con los datos migrados

---

## 📝 Datos de Empleados Esperados

Si migraste correctamente, deberías ver:

```
TRANSPORTES D&F:
- Todos los empleados que tenías en 3-102-908063

TRANSPORTES GYA:
- Todos los empleados que tenías en 3-102-753174
```

Si no ves nada:
- ✓ Verifica que hayas hecho la migración de empleados
- ✓ Verifica que estés logueado con usuario correcto
- ✓ Verifica que la empresa sea la correcta
- ✓ Abre consola (F12) para ver errores

---

## 🗑️ Limpiar Datos Antiguos (Opcional)

Después de verificar que todo funciona, puedes eliminar manualmente:

1. Firebase Console → Firestore
2. Ir a `empresas/3-102-908063/empleados/` → Eliminar documentos
3. Ir a `empresas/3-102-753174/empleados/` → Eliminar documentos

O dejarlos como backup.

