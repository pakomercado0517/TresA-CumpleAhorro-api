# Modelos de Base de Datos

Este directorio contiene todos los modelos de Sequelize para la aplicación Tanda Cumpleañera.

## Modelos

### User
- **Tabla**: `Users`
- **Campos**:
  - `id` (PK, auto-increment)
  - `name` (string, required, 2-100 caracteres)
  - `email` (string, required, unique, formato email)
  - `passwordHash` (string, required)
  - `createdAt`, `updatedAt` (timestamps automáticos)

- **Relaciones**:
  - `hasMany` Group

### Group
- **Tabla**: `Groups`
- **Campos**:
  - `id` (PK, auto-increment)
  - `userId` (FK → User.id, required)
  - `name` (string, required, 1-100 caracteres)
  - `amountPerBirthday` (decimal 10,2, required, min: 0)
  - `description` (text, optional)
  - `createdAt`, `updatedAt` (timestamps automáticos)

- **Relaciones**:
  - `belongsTo` User
  - `hasMany` Member
  - `hasMany` BirthdayEvent

### Member
- **Tabla**: `Members`
- **Campos**:
  - `id` (PK, auto-increment)
  - `groupId` (FK → Group.id, required)
  - `name` (string, required, 1-100 caracteres)
  - `phone` (string, optional, max 20 caracteres)
  - `birthday` (date, required) - Fecha sin año
  - `photoUrl` (string, optional, formato URL)
  - `createdAt`, `updatedAt` (timestamps automáticos)

- **Relaciones**:
  - `belongsTo` Group
  - `hasMany` BirthdayEvent
  - `hasMany` Payment (como pagador)

### BirthdayEvent
- **Tabla**: `BirthdayEvents`
- **Campos**:
  - `id` (PK, auto-increment)
  - `memberId` (FK → Member.id, required)
  - `groupId` (FK → Group.id, required)
  - `birthdayDate` (date, required) - Fecha completa con año
  - `expectedAmount` (decimal 10,2, required, min: 0)
  - `createdAt`, `updatedAt` (timestamps automáticos)

- **Relaciones**:
  - `belongsTo` Member
  - `belongsTo` Group
  - `hasMany` Payment

### Payment
- **Tabla**: `Payments`
- **Campos**:
  - `id` (PK, auto-increment)
  - `birthdayEventId` (FK → BirthdayEvent.id, required)
  - `memberId` (FK → Member.id, required) - Miembro que realiza el pago
  - `amount` (decimal 10,2, required, min: 0)
  - `datePaid` (date, required)
  - `proofUrl` (string, optional, formato URL) - URL del comprobante
  - `createdAt`, `updatedAt` (timestamps automáticos)

- **Relaciones**:
  - `belongsTo` BirthdayEvent
  - `belongsTo` Member (como pagador)

## Diagrama de Relaciones

```
User
  └── hasMany → Group
        ├── hasMany → Member
        │     ├── hasMany → BirthdayEvent
        │     └── hasMany → Payment (como pagador)
        └── hasMany → BirthdayEvent
              └── hasMany → Payment
```

## Validaciones Implementadas

- **User**: Email único, nombre entre 2-100 caracteres
- **Group**: Nombre entre 1-100 caracteres, amountPerBirthday >= 0
- **Member**: Nombre entre 1-100 caracteres, teléfono max 20 caracteres, birthday válido
- **BirthdayEvent**: Fecha válida, expectedAmount >= 0
- **Payment**: Amount >= 0, fecha válida

## Uso

```typescript
import { User, Group, Member, BirthdayEvent, Payment } from "./models";

// Crear un usuario
const user = await User.create({
  name: "Juan Pérez",
  email: "juan@example.com",
  passwordHash: "hashed_password"
});

// Crear un grupo
const group = await Group.create({
  userId: user.id,
  name: "Grupo de Cumpleaños",
  amountPerBirthday: 500.00,
  description: "Grupo familiar"
});

// Cargar relaciones
const groupWithMembers = await Group.findByPk(groupId, {
  include: [
    { model: Member },
    { model: User }
  ]
});
```

