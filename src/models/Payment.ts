import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt
} from "sequelize-typescript";

import { BirthdayEvent } from "./BirthdayEvent";
import { Member } from "./Member";

@Table({
  tableName: "Payments",
  timestamps: true
})
export class Payment extends Model<Payment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  declare id: number;

  @ForeignKey(() => BirthdayEvent)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  birthdayEventId!: number;

  @ForeignKey(() => Member)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  memberId!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: true
    }
  })
  amount!: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    validate: {
      notNull: true,
      isDate: true
    }
  })
  datePaid!: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  })
  proofUrl?: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => BirthdayEvent)
  birthdayEvent!: BirthdayEvent;

  @BelongsTo(() => Member)
  member!: Member;
}

