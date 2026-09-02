# Plan de Ejecución Paso a Paso

- [ ] **Fase 1: Configuración de Base de Datos y Backend Base**
  - [ ] Inicializar proyecto NestJS con Prisma ORM.
  - [ ] Cargar `database.md` en `schema.prisma` y ejecutar primera migración a PostgreSQL.
  - [ ] Configurar módulo de autenticación (JWT + bcrypt).

- [ ] **Fase 2: Módulo de Usuarios y Perfiles**
  - [ ] Implementar creación de usuarios (Estudiante/Profesor/Admin) por parte del Admin.
  - [ ] Configurar `RolesGuard` para restringir endpoints.

- [ ] **Fase 3: Módulo de Prácticas**
  - [ ] Implementar la regla de 1 práctica `IN_PROGRESS` por estudiante en el `PracticesService`.
  - [ ] Implementar lógica de asignación y auto-vinculación de profesor.
  - [ ] Restringir la opción de des-asignar profesor únicamente al rol `ADMIN`.

- [ ] **Fase 4: Módulo de Notas y Auditoría**
  - [ ] Implementar servicio de notas con soporte para guardar HTML y adjuntos.
  - [ ] Añadir validación de 5 minutos en `NotesService.update` y `NotesService.delete`.
  - [ ] Crear un interceptor o listener que genere una nota con `isSystem: true` al cambiar de estado una práctica.

- [ ] **Fase 5: Frontend Next.js & UI**
  - [ ] Configurar Next.js con Tailwind y Shadcn UI.
  - [ ] Implementar pantalla de Login y manejo de tokens/sesión por rol.
  - [ ] Crear dashboard y tablas de prácticas según permisos del rol activo.
  - [ ] Implementar componente de Notas estilo hilo/correo con TipTap y subida de archivos.

- [ ] **Fase 6: Verificación y Cierre**
  - [ ] Ejecutar pruebas del QA-Agent para confirmar reglas de borde.
