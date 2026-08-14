# ControlEmpresa 🏢

Sistema moderno de gestión interna empresarial desarrollado con **Angular 18** y **Angular Material**. Esta plataforma centraliza los procesos del departamento de Recursos Humanos y permite la autogestión de los colaboradores.

## 🚀 Características Principales

*   **Autogestión de Usuarios:** Cada colaborador puede gestionar y mantener actualizada su información de perfil.
*   **Personalización de Marca:** Soporte para cambiar y personalizar el logotipo de la empresa directamente desde la interfaz.
*   **Control de Planillas:** Módulo centralizado para la visualización, desglose y administración de nóminas/planillas de pago.
*   **Gestión de Vacaciones:** Sistema de solicitudes, aprobaciones y control de días disponibles para el personal.
*   **Incapacidades y Permisos:** Registro y seguimiento digital de ausencias, justificantes médicos y permisos especiales.

---

## 🛠️ Desarrollo

Este proyecto utiliza **Angular CLI** versión 18.x.

### Servidor de Desarrollo

Ejecuta el siguiente comando para levantar un servidor de desarrollo local:
```bash
ng serve
```
Una vez iniciado, navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si realizas cambios en los archivos fuentes.

### Generación de Código

Para crear nuevos elementos en la arquitectura del proyecto, utiliza el comando base de generación:
```bash
ng generate component nombre-del-componente
```
*También puedes generar otros artefactos como: `directive | pipe | service | class | guard | interface | enum | module`.*

### Construcción (Build) para Producción

Para compilar el proyecto y preparar los archivos de distribución listos para producción, ejecuta:
```bash
ng build
```
Los artefactos compilados se guardarán dentro del directorio `dist/control-empresa`.

---

## 🧪 Pruebas (Testing)

### Pruebas Unitarias

Ejecuta las pruebas unitarias del proyecto con el siguiente comando:
```bash
ng test
```

---

## 💡 Ayuda Adicional

Para obtener más información sobre el uso de la interfaz de comandos de Angular (Angular CLI), ejecuta `ng help` o consulta la [Documentación Oficial de Angular](https://angular.dev).
