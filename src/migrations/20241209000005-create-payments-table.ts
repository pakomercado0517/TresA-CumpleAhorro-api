import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("Payments", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    birthdayEventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "BirthdayEvents",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Members",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    datePaid: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    proofUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  });

  // Índices
  await queryInterface.addIndex("Payments", ["birthdayEventId"], {
    name: "Payments_birthdayEventId_index"
  });
  await queryInterface.addIndex("Payments", ["memberId"], {
    name: "Payments_memberId_index"
  });
  // Índice único compuesto para evitar pagos duplicados (un miembro solo puede pagar una vez por evento)
  await queryInterface.addIndex("Payments", ["birthdayEventId", "memberId"], {
    unique: true,
    name: "Payments_birthdayEventId_memberId_unique"
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("Payments");
}
