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
import { Member } from "./Member";
import { Payment } from "./Payment";

@Table({
  tableName: "BirthdayEvents",
  timestamps: true
})
export class BirthdayEvent extends Model<BirthdayEvent> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  declare id: number;

  @ForeignKey(() => Member)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  declare memberId: number;

  @ForeignKey(() => Group)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  declare groupId: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    validate: {
      notNull: true,
      isDate: true
    }
  })
  declare birthdayDate: Date;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: true
    }
  })
  declare expectedAmount: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => Member)
  member!: Member;

  @BelongsTo(() => Group)
  group!: Group;

  @HasMany(() => Payment)
  payments!: Payment[];
}
