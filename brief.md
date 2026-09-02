# Brief del Proyecto: Sistema de Gestión de Prácticas Profesionales

## 1. Visión Ejecutiva
Plataforma web para gestionar el ciclo de vida de prácticas profesionales en entornos académicos. El sistema maneja roles de acceso (Estudiante, Profesor, Administrador), flujo de estados de prácticas, asignaciones, y un sistema de auditoría/comentarios con soporte de texto enriquecido y archivos adjuntos.

## 2. Stack Tecnológico Obligatorio (Inmutable)
- **Backend Framework:** NestJS (TypeScript, arquitectura modular, DTOs con class-validator).
- **ORM & Database:** Prisma ORM sobre PostgreSQL.
- **Frontend Framework:** Next.js (App Router, TypeScript).
- **Estilos & UI:** Tailwind CSS, Shadcn UI, React Query / TanStack Query.
- **Editor Rich Text:** TipTap Editor (para el sistema de notas).
- **Autenticación:** JWT con cookies HTTP-Only o Bearer Tokens.

## 3. Restricciones Técnicas
1. No alterar el stack tecnológico sin autorización.
2. Toda lógica crítica (validación de 5 minutos, permisos, estados) DEBE validarse estrictamente en el Backend.
3. El frontend consume la API REST del backend mediante clientes fuertemente tipados.
