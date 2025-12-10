# Postman Collection - Tanda Cumpleañera API

Esta carpeta contiene la colección de Postman para probar la API de Tanda Cumpleañera.

## 📦 Archivos

- **Tanda-Cumpleañera-API.postman_collection.json** - Colección principal con todos los endpoints
- **Tanda-Cumpleañera-Environment.postman_environment.json** - Variables de entorno para desarrollo local

## 🚀 Configuración

### 1. Importar en Postman

1. Abre Postman
2. Click en **Import** (botón superior izquierdo)
3. Arrastra los archivos `.json` o selecciónalos
4. Importa tanto la colección como el environment

### 2. Configurar Environment

1. Selecciona el environment **"Tanda Cumpleañera - Local"** en el dropdown superior derecho
2. Verifica que `base_url` esté configurado como `http://localhost:3001`
3. Si usas otro puerto, actualiza la variable `base_url`

### 3. Variables de Entorno

Las siguientes variables se configuran automáticamente:

- `auth_token` - Token JWT (se guarda automáticamente después de login/register)
- `user_id` - ID del usuario autenticado
- `user_email` - Email del usuario autenticado
- `group_id` - ID del último grupo creado o listado
- `member_id` - ID del último miembro creado o listado
- `event_id` - ID del último evento creado o listado
- `payment_id` - ID del último pago creado o listado

## 📋 Endpoints Disponibles

### 🔐 Auth

#### POST /api/auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123"
}
```

#### POST /api/auth/login
Autentica un usuario y retorna token JWT.

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "Password123"
}
```

### 👥 Groups

#### GET /api/groups
Lista todos los grupos del usuario autenticado.

#### POST /api/groups
Crea un nuevo grupo.

**Body:**
```json
{
  "name": "Grupo de Cumpleaños 2024",
  "amountPerBirthday": 500,
  "description": "Grupo para celebrar cumpleaños del año 2024"
}
```

#### GET /api/groups/:id
Obtiene el detalle de un grupo por ID.

#### PUT /api/groups/:id
Actualiza un grupo existente.

#### DELETE /api/groups/:id
Elimina un grupo.

### 👤 Members

#### GET /api/groups/:groupId/members
Lista todos los miembros de un grupo.

#### POST /api/groups/:groupId/members
Crea un nuevo miembro en un grupo.

**Body:**
```json
{
  "name": "María González",
  "phone": "1234567890",
  "birthday": "1990-03-15",
  "photoUrl": "https://example.com/photo.jpg"
}
```

#### GET /api/members/:id
Obtiene el detalle de un miembro por ID.

#### PUT /api/members/:id
Actualiza un miembro existente.

#### DELETE /api/members/:id
Elimina un miembro.

### 🎂 Events

#### GET /api/groups/:groupId/events
Lista todos los eventos de cumpleaños de un grupo.

#### POST /api/groups/:groupId/events/generate
Genera eventos de cumpleaños para el año actual de todos los miembros del grupo.

**Nota:** Solo crea eventos para miembros que no tienen evento en el año actual.

#### GET /api/events/:eventId
Obtiene el detalle de un evento por ID, incluyendo información del miembro.

### 💰 Payments

#### GET /api/events/:eventId/payments
Lista todos los pagos de un evento, incluyendo resumen con totales.

**Respuesta incluye:**
- Lista de pagos con información del miembro pagador
- Resumen: `totalPaid`, `totalExpected`, `remaining`, `percentageCompleted`

#### POST /api/events/:eventId/payments
Registra un nuevo pago para un evento.

**Body:**
```json
{
  "memberId": 1,
  "amount": 500,
  "datePaid": "2024-12-15",
  "proofUrl": "https://example.com/proof.jpg"
}
```

**Nota:** Un miembro solo puede tener un pago por evento.

#### GET /api/payments/:id
Obtiene el detalle de un pago por ID, incluyendo información del miembro.

#### PUT /api/payments/:id
Actualiza un pago existente.

#### DELETE /api/payments/:id
Elimina un pago.

### 🏥 Health Check

#### GET /
Verifica que la API esté funcionando.

## 🔐 Uso del Token JWT

Para usar el token en requests protegidos:

1. El token se guarda automáticamente después de hacer login/register
2. Todos los endpoints protegidos incluyen automáticamente el header `Authorization: Bearer {{auth_token}}`
3. Si el token expira, vuelve a hacer login para obtener uno nuevo

## 📝 Flujo de Prueba Recomendado

1. **Autenticación:**
   - POST /api/auth/register (o POST /api/auth/login si ya tienes usuario)

2. **Crear Grupo:**
   - POST /api/groups (crea un grupo de prueba)

3. **Agregar Miembros:**
   - POST /api/groups/:groupId/members (agrega varios miembros)

4. **Generar Eventos:**
   - POST /api/groups/:groupId/events/generate (genera eventos para el año actual)

5. **Registrar Pagos:**
   - POST /api/events/:eventId/payments (registra pagos de los miembros)

6. **Consultar Información:**
   - GET /api/events/:eventId/payments (ve el resumen de pagos)

## ⚠️ Notas Importantes

- **Rate Limiting**: Solo está activo cuando `NODE_ENV=production`
- **Validaciones**: Todos los endpoints validan los datos con express-validator
- **Errores**: Los errores de validación retornan detalles en el campo `error`
- **Timezones**: Las fechas se manejan en timezone de Veracruz, México (America/Mexico_City)
- **Fechas**: Formato requerido: `yyyy-MM-dd` (ejemplo: `2024-12-15`)

## 🔄 Actualizar la Colección

Cuando se agreguen nuevos endpoints, actualiza este archivo y la colección de Postman.

---

**Última actualización**: 2024-12-09
