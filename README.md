# Gestor Tanda API

Backend API para **Tanda Cumpleañera** - Sistema de gestión de grupos de ahorro rotativo para cumpleaños.

## 📋 Descripción

API REST desarrollada en Node.js con TypeScript que permite gestionar grupos de ahorro rotativo (tandas) para celebrar cumpleaños. Los usuarios pueden crear grupos, agregar miembros, generar eventos de cumpleaños y registrar pagos.

## 🚀 Tecnologías

- **Node.js** - Runtime de JavaScript
- **TypeScript** - Lenguaje de programación
- **Express** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM para PostgreSQL
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **Brevo** - Servicio de emails (también soporta Gmail SMTP y Resend)
- **date-fns** - Manejo de fechas y timezones

## 📦 Instalación

### Prerrequisitos

- Node.js (v20 o superior)
- pnpm (package manager)
- PostgreSQL (v12 o superior)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd gestor-tanda-api
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   DATABASE_URL=postgresql://usuario:password@localhost:5432/tanda_cumpleanera
   JWT_SECRET=tu-secret-key-super-segura
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   
   # Email Provider (brevo, gmail, o resend)
   EMAIL_PROVIDER=brevo
   FROM_EMAIL=tu-email@example.com
   BREVO_API_KEY=tu-api-key-de-brevo
   ```

4. **Crear la base de datos**
   ```bash
   pnpm db:create
   ```

5. **Ejecutar migraciones**
   ```bash
   pnpm db:migrate
   ```

6. **Poblar con datos de ejemplo (opcional)**
   ```bash
   pnpm db:seed
   ```

## 🛠️ Scripts Disponibles

### Desarrollo
- `pnpm dev` - Inicia el servidor en modo desarrollo con nodemon
- `pnpm build` - Compila TypeScript a JavaScript
- `pnpm start` - Inicia el servidor en producción

### Calidad de Código
- `pnpm lint` - Ejecuta ESLint
- `pnpm lint:fix` - Ejecuta ESLint y corrige errores automáticamente
- `pnpm format` - Formatea el código con Prettier
- `pnpm format:check` - Verifica el formato del código

### Base de Datos
- `pnpm db:create` - Crea la base de datos si no existe
- `pnpm db:migrate` - Ejecuta las migraciones pendientes
- `pnpm db:migrate:undo` - Revierte la última migración
- `pnpm db:migrate:status` - Muestra el estado de las migraciones
- `pnpm db:seed` - Ejecuta los seeds para poblar datos de ejemplo
- `pnpm db:drop` - Elimina la base de datos
- `pnpm db:reset` - Resetea la base de datos (drop + create + migrate + seed)

### Utilidades
- `pnpm test:email` - Prueba el servicio de email

## 📁 Estructura del Proyecto

```
gestor-tanda-api/
├── src/
│   ├── config/          # Configuraciones (DB, env, Sequelize)
│   ├── controllers/     # Controladores HTTP
│   ├── middlewares/     # Middlewares (auth, validation, rate-limit)
│   ├── migrations/      # Migraciones de base de datos
│   ├── models/          # Modelos de Sequelize
│   ├── routes/          # Definición de rutas
│   ├── seeds/           # Seeds para datos de ejemplo
│   ├── services/        # Lógica de negocio
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilidades (bcrypt, jwt, dates, email)
│   ├── validators/      # Validaciones con express-validator
│   ├── index.ts         # Punto de entrada
│   └── server.ts        # Configuración del servidor Express
├── scripts/             # Scripts auxiliares
├── docs/                # Documentación
│   ├── API/             # Documentación de la API
│   └── PRD.md           # Product Requirements Document
├── postman/             # Colección de Postman para testing
└── dist/                # Código compilado (generado)
```

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación. Los endpoints protegidos requieren el header:

```
Authorization: Bearer <token>
```

### Endpoints de Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify-email?token=xxx` - Verificar email
- `POST /api/auth/forgot-password` - Solicitar reset de contraseña
- `POST /api/auth/reset-password` - Resetear contraseña

## 📚 Documentación de la API

La documentación completa de la API está disponible en:

- **Documentación General**: `docs/API/API_DOCUMENTATION.md`
- **Tipos TypeScript**: `docs/API/API_TYPES.ts`
- **Manejo de Fechas**: `docs/API/DATE_HANDLING_FRONTEND.md`
- **Flujo de Emails**: `docs/API/EMAIL_FLOW_FRONTEND.md`

### Endpoints Principales

#### Grupos
- `GET /api/groups` - Listar grupos del usuario
- `POST /api/groups` - Crear grupo
- `GET /api/groups/:id` - Obtener grupo por ID
- `PUT /api/groups/:id` - Actualizar grupo
- `DELETE /api/groups/:id` - Eliminar grupo

#### Miembros
- `GET /api/groups/:groupId/members` - Listar miembros de un grupo
- `POST /api/groups/:groupId/members` - Agregar miembro
- `GET /api/groups/:groupId/members/:id` - Obtener miembro por ID
- `PUT /api/groups/:groupId/members/:id` - Actualizar miembro
- `DELETE /api/groups/:groupId/members/:id` - Eliminar miembro

#### Eventos de Cumpleaños
- `GET /api/groups/:groupId/events` - Listar eventos de un grupo
- `POST /api/groups/:groupId/events/generate` - Generar eventos para el año actual
- `GET /api/groups/:groupId/events/:id` - Obtener evento por ID

#### Pagos
- `GET /api/events/:eventId/payments` - Listar pagos de un evento
- `POST /api/events/:eventId/payments` - Registrar pago
- `GET /api/events/:eventId/payments/:id` - Obtener pago por ID
- `PUT /api/events/:eventId/payments/:id` - Actualizar pago
- `DELETE /api/events/:eventId/payments/:id` - Eliminar pago

## 📧 Sistema de Emails

El proyecto soporta múltiples proveedores de email:

- **Brevo (Sendinblue)** - Recomendado para producción sin dominio
- **Gmail SMTP** - Para desarrollo rápido
- **Resend** - Requiere dominio verificado

Configuración en `.env`:
```env
EMAIL_PROVIDER=brevo
FROM_EMAIL=tu-email@example.com
BREVO_API_KEY=tu-api-key
```

### Funcionalidades de Email

- ✅ Verificación de email al registrarse
- ✅ Reset de contraseña
- ✅ Notificaciones (extensible)

## 🗄️ Base de Datos

### Modelos

- **User** - Usuarios del sistema
- **Group** - Grupos de tanda
- **Member** - Miembros de los grupos
- **BirthdayEvent** - Eventos de cumpleaños
- **Payment** - Pagos realizados

### Migraciones

Las migraciones se ejecutan automáticamente con `pnpm db:migrate`. El orden es importante debido a las relaciones entre tablas.

## 🧪 Testing

### Postman

Se incluye una colección de Postman en `postman/` con todos los endpoints configurados y scripts para guardar tokens automáticamente.

### Datos de Prueba

Los seeds incluyen:
- 3 usuarios de ejemplo (password: `Password123`)
- 3 grupos de ejemplo
- 8 miembros de ejemplo
- Eventos y pagos de ejemplo

## ⚙️ Configuración

### Variables de Entorno Requeridas

- `DATABASE_URL` - URL de conexión a PostgreSQL
- `JWT_SECRET` - Secret key para JWT
- `JWT_EXPIRES_IN` - Tiempo de expiración del token (default: 7d)
- `NODE_ENV` - Entorno (development, production)
- `PORT` - Puerto del servidor (default: 3001)
- `FRONTEND_URL` - URL del frontend (para links en emails)

### Variables de Entorno Opcionales

- `EMAIL_PROVIDER` - Proveedor de email (brevo, gmail, resend)
- `FROM_EMAIL` - Email remitente
- `BREVO_API_KEY` - API key de Brevo
- `GMAIL_USER` - Usuario de Gmail
- `GMAIL_APP_PASSWORD` - App password de Gmail
- `RESEND_API_KEY` - API key de Resend

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Hash de contraseñas con bcrypt (12 rounds)
- ✅ Rate limiting en producción
- ✅ Validación de inputs con express-validator
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado
- ✅ Manejo seguro de errores

## 📝 Convenciones de Código

- **TypeScript strict mode** activado
- **No usar `any`** - Siempre tipos específicos
- **ESLint** con reglas estrictas
- **Prettier** para formato automático
- **Nombres en camelCase** para variables/funciones
- **Nombres en PascalCase** para clases/interfaces
- **Archivos en kebab-case**

## 🐛 Troubleshooting

### Error: "relation does not exist"
Ejecuta las migraciones: `pnpm db:migrate`

### Error: "Email service no está configurado"
Verifica que las variables de entorno de email estén configuradas en `.env`

### Error: "Token expirado"
Los tokens de verificación expiran en 24h, los de reset en 1h

## 📄 Licencia

ISC

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para problemas o preguntas, abre un issue en el repositorio.

---

**Desarrollado con ❤️ para gestionar tandas de cumpleaños**
