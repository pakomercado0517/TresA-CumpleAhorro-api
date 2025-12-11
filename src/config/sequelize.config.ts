import { Sequelize } from "sequelize-typescript";

import { env } from "./env.config";

import { User } from "../models/User";
import { Group } from "../models/Group";
import { Member } from "../models/Member";
import { BirthdayEvent } from "../models/BirthdayEvent";
import { Payment } from "../models/Payment";

const getDatabaseUrl = (): string => {
  return env.DATABASE_URL;
};

const parseDatabaseUrl = (url: string): {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
} => {
  // Formato: postgresql://user:password@host:port/database
  const urlPattern = /^postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error("Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database");
  }

  const [, , username, password, host, port, database] = match;

  return {
    host,
    port: parseInt(port, 10),
    database,
    username,
    password
  };
};

const databaseUrl = getDatabaseUrl();
const parsedConfig = parseDatabaseUrl(databaseUrl);

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: parsedConfig.host,
  port: parsedConfig.port,
  database: parsedConfig.database,
  username: parsedConfig.username,
  password: parsedConfig.password,
  models: [User, Group, Member, BirthdayEvent, Payment],
  logging: process.env.NODE_ENV === "development" 
    ? (sql: string) => {
        // Solo mostrar queries en modo debug, no en desarrollo normal
        if (process.env.DEBUG_SQL === "true") {
          console.log(sql);
        }
      }
    : false,
  timezone: "+00:00", // Forzar UTC en Sequelize
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  },
  dialectOptions: {
    useUTC: true,
    dateStrings: false,
    typeCast: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;

