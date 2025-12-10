import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Agregar campo emailVerified
  await queryInterface.addColumn("Users", "emailVerified", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  // Agregar campo emailVerificationToken
  await queryInterface.addColumn("Users", "emailVerificationToken", {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  });

  // Agregar campo passwordResetToken
  await queryInterface.addColumn("Users", "passwordResetToken", {
    type: DataTypes.STRING(255),
    allowNull: true
  });

  // Agregar campo passwordResetExpires
  await queryInterface.addColumn("Users", "passwordResetExpires", {
    type: DataTypes.DATE,
    allowNull: true
  });

  // Índice para emailVerificationToken
  await queryInterface.addIndex("Users", ["emailVerificationToken"], {
    unique: true,
    name: "Users_emailVerificationToken_unique"
  });

  // Índice para passwordResetToken (para búsquedas rápidas)
  await queryInterface.addIndex("Users", ["passwordResetToken"], {
    name: "Users_passwordResetToken_index"
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Eliminar índices primero
  await queryInterface.removeIndex("Users", "Users_passwordResetToken_index");
  await queryInterface.removeIndex("Users", "Users_emailVerificationToken_unique");

  // Eliminar columnas
  await queryInterface.removeColumn("Users", "passwordResetExpires");
  await queryInterface.removeColumn("Users", "passwordResetToken");
  await queryInterface.removeColumn("Users", "emailVerificationToken");
  await queryInterface.removeColumn("Users", "emailVerified");
}

