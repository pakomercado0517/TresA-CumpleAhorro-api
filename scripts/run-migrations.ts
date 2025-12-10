import { config } from "dotenv";
import { Umzug, SequelizeStorage } from "umzug";
import * as path from "path";
import * as fs from "fs";

import { sequelize } from "../src/config/sequelize.config";

config();

const migrationsPath = path.join(__dirname, "../src/migrations");

console.log("📁 Buscando migrations en:", migrationsPath);

const umzug = new Umzug({
  migrations: {
    glob: ["*.ts", { cwd: migrationsPath }],
    resolve: ({ name, path: migrationPath, context }) => {
      console.log(`  📄 Cargando migration: ${name}`);
      if (!migrationPath) {
        throw new Error(`No se encontró la ruta para la migration: ${name}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const migration = require(migrationPath);
      return {
        name,
        up: async () => {
          if (migration.up) {
            return migration.up(context);
          }
          throw new Error(`Migration ${name} no tiene método 'up'`);
        },
        down: async () => {
          if (migration.down) {
            return migration.down(context);
          }
          throw new Error(`Migration ${name} no tiene método 'down'`);
        }
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

const command = process.argv[2] ?? "up";

async function runMigrations(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    if (command === "up") {
      console.log("🔄 Ejecutando migrations...");
      await umzug.up();
      console.log("✅ Todas las migrations ejecutadas correctamente");
    } else if (command === "down") {
      console.log("🔄 Revirtiendo última migration...");
      await umzug.down();
      console.log("✅ Migration revertida correctamente");
    } else if (command === "status") {
      const pending = await umzug.pending();
      const executed = await umzug.executed();
      console.log("\n📊 Estado de migrations:");
      console.log(`✅ Ejecutadas: ${executed.length}`);
      console.log(`⏳ Pendientes: ${pending.length}`);
      if (pending.length > 0) {
        console.log("\nPendientes:");
        pending.forEach((m) => console.log(`  - ${m.name}`));
      }
    } else {
      console.error(`Comando desconocido: ${command}`);
      console.log("Comandos disponibles: up, down, status");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

void runMigrations();

