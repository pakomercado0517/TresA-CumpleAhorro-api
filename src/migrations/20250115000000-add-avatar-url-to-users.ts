import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Agregar campo avatarUrl
  await queryInterface.addColumn("Users", "avatarUrl", {
    type: DataTypes.STRING(500),
    allowNull: true
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Eliminar columna
  await queryInterface.removeColumn("Users", "avatarUrl");
}





