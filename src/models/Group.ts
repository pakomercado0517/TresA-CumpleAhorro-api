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

import { User } from "./User";
import { Member } from "./Member";
import { BirthdayEvent } from "./BirthdayEvent";

@Table({
  tableName: "Groups",
  timestamps: true
})
export class Group extends Model<Group> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  userId!: number;

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
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      notNull: true
    }
  })
  amountPerBirthday!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description?: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  // Relaciones
  @BelongsTo(() => User)
  user!: User;

  @HasMany(() => Member)
  members!: Member[];

  @HasMany(() => BirthdayEvent)
  birthdayEvents!: BirthdayEvent[];
}

