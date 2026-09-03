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

## 🚀 Cómo iniciar el proyecto

Antes de iniciar, configura tus credenciales basadas en el ejemplo:

```bash
cp .env.example .env
# Edita el archivo .env con tus valores reales
```

Luego, inicia los servicios con el script centralizado:

```bash
# Iniciar en modo desarrollo (Hot reload + Docker)
./start.sh dev

# Iniciar en modo producción (Build + Start)
./start.sh prod
```

*Requisito: Tener instalado Docker, Node.js y pnpm.*


## 📁 Estructura del Proyecto

```text
.
├── apps/                      # Código fuente de Frontend y Backend
├── prisma/                    # Esquema y migraciones de la base de datos
├── .env                       # Configuración unificada de variables
├── .env.example               # Plantilla de variables de entorno
├── docker-compose.yml         # Definición de servicios (PostgreSQL)
├── start.sh                   # Script centralizado de inicio (dev/prod)
├── pnpm-workspace.yaml        # Configuración del monorepo pnpm
├── package.json               # Dependencias raíz y scripts globales
├── README.md                  # Visión general y guía de inicio
└── *.md                       # Documentación adicional y contexto agéntico
```
## ⚙️ Configuración de Entorno (.env)

El proyecto utiliza una configuración **unificada** en la raíz del proyecto para facilitar la gestión:

- **`./.env`**: Contiene todas las variables de entorno para el backend, frontend y la base de datos.

> **Nota:** Si ejecutas las aplicaciones localmente sin `docker-compose`, asegúrate de cargar las variables de este archivo manualmente.

## 🐘 ¿Por qué PostgreSQL?

Utilizamos **PostgreSQL** por estas razones:

1. **ACID Compliance:** Garantiza la integridad total de los datos, esencial para auditorías y reglas de negocio estrictas.
2. **Relational Model:** La lógica de asignación y las restricciones entre entidades del sistema se mapean naturalmente a un esquema SQL relacional.
3. **Robustez:** Su madurez garantiza un rendimiento fiable para el mantenimiento de registros inalterables y trazables.

## 💡 Sobre la estructura

Este proyecto utiliza un **monorepo con `pnpm`**.

- **`node_modules` (Raíz):** Contiene todas las dependencias compartidas para `backend` y `frontend`. **No mover**: hacerlo rompería el `pnpm-workspace` y duplicaría innecesariamente el espacio en disco.
- **`prisma/` (Raíz):** Mantenemos el esquema aquí para que sea fácilmente accesible por herramientas de desarrollo y agentes agénticos, evitando rutas relativas complejas dentro de las apps.
