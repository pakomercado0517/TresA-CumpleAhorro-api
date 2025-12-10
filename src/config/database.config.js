// Este archivo es necesario para Sequelize CLI (no soporta TypeScript directamente)
const path = require("path");
require("dotenv").config();

const parseDatabaseUrl = (url) => {
  if (!url) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  // Formato: postgresql://user:password@host:port/database
  const urlPattern = /^postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error("Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database");
  }

  const [, , username, password, host, port, database] = match;

  return {
    username,
    password,
    database,
    host,
    port: parseInt(port, 10),
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
};

const databaseUrl = process.env.DATABASE_URL;
const parsedConfig = parseDatabaseUrl(databaseUrl);

module.exports = {
  development: {
    ...parsedConfig,
    logging: console.log
  },
  test: {
    ...parsedConfig,
    logging: false
  },
  production: {
    ...parsedConfig,
    logging: false
  }
};

