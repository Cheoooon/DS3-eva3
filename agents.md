# Roles y Sub-Agentes para la Ejecución del Proyecto

## 1. Arch-Agent (Arquitecto de Software)
- Inicializa el proyecto, configura NestJS, Next.js y el entorno de base de datos.
- Aplica el esquema de Prisma y genera migraciones.
- Mantiene la coherencia estructural de los archivos y dependencias.

## 2. Backend-Agent (Especialista en NestJS)
- Crea módulos (`Auth`, `Users`, `Practices`, `Notes`).
- Aplica guards (`RolesGuard`, `JwtAuthGuard`) y DTOs con validaciones.
- Implementa los interceptores de auditoría para generar notas de sistema automáticamente al modificar prácticas.
- Garantiza que la validación del temporizador de 5 minutos se ejecute en los servicios REST.

## 3. Frontend-Agent (Especialista en Next.js/React)
- Construye las vistas y layouts en Next.js según el rol autenticado.
- Integra React Query para llamadas a la API.
- Implementa la interfaz de notas con TipTap (con formato de correo/adjuntos).
- Maneja el estado UI para ocultar/deshabilitar la edición de notas cuando expiren los 5 minutos.

## 4. QA-Agent (Validación y Tests)
- Genera pruebas unitarias e integración en Jest.
- Prueba explícitamente:
  1. Que un estudiante no cree 2 prácticas `IN_PROGRESS`.
  2. Que una nota no pueda editarse después de 301 segundos.
  3. Que un profesor no pueda ser des-asignado por nadie diferente al Admin.
