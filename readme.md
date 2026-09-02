# Sistema de Gestión y Trazabilidad de Prácticas Profesionales

## 🎯 Motivo e Intención del Proyecto

El proceso de seguimiento de prácticas profesionales en entornos académicos suele presentar problemas de **desorganización, falta de transparencia y dispersión de la información**. Los acuerdos, cambios de estado y comentarios entre estudiantes, profesores guía y la administración suelen perderse en cadenas de correos o mensajería informal.

Este proyecto nace con la intención de resolver esta problemática mediante una **plataforma centralizada, estructurada y auditable** que ofrece:

1. **Claridad en los Roles y Permisos:** 
   - **Estudiantes:** Pueden gestionar e iniciar su proceso formativo manteniendo visibilidad exclusiva sobre sus registros.
   - **Profesores:** Tienen un entorno para supervisar a sus alumnos asignados, evaluar avances y gestionar los estados de la práctica.
   - **Administradores:** Controlan la gobernanza global del sistema, la asignación de docentes y la creación de perfiles.

2. **Garantía de Reglas de Negocio Estrictas:**
   - Evita duplicidades garantizando que un estudiante solo pueda tener **una práctica activa (`IN_PROGRESS`) a la vez**.
   - Preserva la responsabilidad docente impidiendo la des-asignación no autorizada de profesores sin mediación administrativa.

3. **Trazabilidad e Inmutabilidad (Auditoría):**
   - Incorpora un **sistema de notas tipo hilo de comunicación (estilo correo)** con soporte para texto enriquecido y archivos adjuntos.
   - Genera **notas de sistema automáticas** ante cambios críticos (modificación de datos, cambios de estado) para mantener un historial transparente e inalterable.
   - Aplica una regla de ventana de tiempo (**temporizador de 5 minutos**) para la edición o eliminación de notas personales, asegurando la integridad de los registros.

---

## 🛠️ Stack Tecnológico

La aplicación está construida sobre una arquitectura modular de alto rendimiento, fácil mantenimiento y tipado estático end-to-end:

* **Backend:** [NestJS](https://nestjs.com/) (Node.js + TypeScript)
* **Base de Datos:** [PostgreSQL](https://www.postgresql.org/)
* **ORM:** [Prisma ORM](https://www.prisma.io/)
* **Frontend:** [Next.js](https://nextjs.org/) (App Router + React + TypeScript)
* **Diseño y Componentes:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
* **Editor de Texto Enriquecido:** [TipTap](https://tiptap.dev/)

---

## 📁 Estructura del Proyecto

```text
.
├── docs/                      # Arnés agéntico y documentación del sistema
│   ├── brief.md               # Contexto general y restricciones
│   ├── requirements.md        # Reglas de negocio e historias de usuario
│   ├── database.md            # Esquema de Prisma ORM
│   ├── agents.md              # Definición de roles de IA para desarrollo
│   └── execution_plan.md      # Checklist y roadmap de implementación
├── prisma/                    # Esquema y migraciones de la base de datos
├── apps/ (o src/)             # Código fuente de Frontend y Backend
└── README.md                  # Visión general del proyecto
