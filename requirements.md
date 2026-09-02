# Requisitos y Reglas de Negocio Inmutables

## 1. Roles y Accesos
- **ADMINISTRADOR (ADMIN):**
  - Crea perfiles de estudiantes y profesores (asignando credenciales).
  - Puede ver, editar y eliminar cualquier práctica o nota (incluyendo notas del sistema).
  - Es el ÚNICO que puede des-asignar a un profesor de una práctica.
  - Puede crear prácticas asignando directamente estudiante y profesor.
  - Restablece contraseñas manualmente.

- **PROFESOR (TEACHER):**
  - Ve todas las prácticas donde está asignado como profesor activo.
  - Puede editar o cambiar el estado de las prácticas asignadas.
  - Al crear una práctica, se auto-asigna como el profesor activo de la misma.
  - Puede administrar (editar/eliminar) sus propias notas o las del estudiante dentro del límite de tiempo.

- **ESTUDIANTE (STUDENT):**
  - Solo puede ver sus propias prácticas (no ve las de otros).
  - Puede crear una práctica (esta nace sin profesor asignado).
  - Puede crear notas y adjuntar archivos en sus prácticas.
  - No puede asignar ni cambiar profesores ni cambiar el estado de la práctica.

## 2. Reglas del Flujo de Prácticas
- **Estados:** `IN_PROGRESS` (En proceso), `FINISHED` (Terminada).
- **Regla de Práctica Única:** Un estudiante SOLO puede tener 1 práctica activa (`IN_PROGRESS`) a la vez. No se permite crear una nueva si ya tiene una en proceso.
- El cambio de estado a `FINISHED` solo puede realizarlo el Profesor asignado o el Administrador.

## 3. Reglas del Sistema de Notas y Trazabilidad
- Las notas soportan texto enriquecido (HTML/Rich Text) y archivos adjuntos (imágenes/documentos).
- **Notas de Sistema (`isSystem = true`):**
  - Registran automáticamente eventos (ej. cambio de estado, modificación de campos, creación).
  - Son inmutables para usuarios normales.
  - SOLO el Administrador puede eliminar notas de sistema.
- **Temporizador de 5 Minutos (Validación crítica en Backend):**
  - Un usuario (Estudiante o Profesor) tiene exactamente 5 minutos desde `createdAt` para editar o eliminar una nota propia.
  - Fórmula: `Si (now() - note.createdAt) > 5 minutos`, el servidor rechaza la edición/eliminación con HTTP 403 Forbidden.
  - Excepción: El Administrador no tiene restricción de tiempo.
