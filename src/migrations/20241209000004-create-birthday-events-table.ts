import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("BirthdayEvents", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
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
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Groups",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    birthdayDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    expectedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
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
  await queryInterface.addIndex("BirthdayEvents", ["memberId"], {
    name: "BirthdayEvents_memberId_index"
  });
  await queryInterface.addIndex("BirthdayEvents", ["groupId"], {
    name: "BirthdayEvents_groupId_index"
  });
  // Índice compuesto para evitar eventos duplicados (mismo miembro, mismo año)
  await queryInterface.addIndex("BirthdayEvents", ["memberId", "birthdayDate"], {
    name: "BirthdayEvents_memberId_birthdayDate_index"
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("BirthdayEvents");
}

