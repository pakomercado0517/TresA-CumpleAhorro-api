import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

import { Group } from "./Group";

@Table({
  tableName: "Users",
  timestamps: true
})
export class User extends Model<User> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  })
  declare passwordHash: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  declare emailVerified: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true
  })
  declare emailVerificationToken: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare passwordResetToken: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  declare passwordResetExpires: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @HasMany(() => Group)
  groups!: Group[];
}

