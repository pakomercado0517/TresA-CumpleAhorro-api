import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

import { Group } from "./Group";
import { BirthdayEvent } from "./BirthdayEvent";
import { Payment } from "./Payment";

@Table({
  tableName: "Members",
  timestamps: true
})
export class Member extends Model<Member> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  declare id: number;

  @ForeignKey(() => Group)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  groupId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      len: [0, 20]
    }
  })
  phone?: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    validate: {
      notNull: true,
      isDate: true
    }
  })
  birthday!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  })
  photoUrl?: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => Group)
  group!: Group;

  @HasMany(() => BirthdayEvent)
  birthdayEvents!: BirthdayEvent[];

  @HasMany(() => Payment)
  payments!: Payment[];
}

