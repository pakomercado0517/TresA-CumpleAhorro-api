import { config } from "dotenv";
import path from "path";
import * as fs from "fs";

// Cargar variables de entorno
config();

import { sequelize } from "../src/config/sequelize.config";

/**
 * Script para ejecutar seeds
 */
async function runSeeds(): Promise<void> {
  try {
    const seedsPath = path.join(__dirname, "../src/seeds");
    console.log("📁 Buscando seeds en:", seedsPath);

    // Verificar conexión
    await sequelize.authenticate();
    console.log("✅ Conexión a la base de datos establecida");

    // Leer archivos de seed
    const seedFiles = fs
      .readdirSync(seedsPath)
      .filter((file) => file.endsWith(".js") && file.includes("seed"))
      .sort();

    if (seedFiles.length === 0) {
      console.log("⚠️ No se encontraron archivos de seed");
      await sequelize.close();
      return;
    }

    console.log(`🌱 Encontrados ${seedFiles.length} seed(s)`);
    console.log("🔄 Ejecutando seeds...\n");

    // Ejecutar cada seed en orden
    for (const seedFile of seedFiles) {
      const seedPath = path.join(seedsPath, seedFile);
      console.log(`  📄 Ejecutando: ${seedFile}`);

      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const seed = require(seedPath);

      if (seed.up) {
        await seed.up(sequelize.getQueryInterface(), sequelize.constructor);
        console.log(`  ✅ ${seedFile} ejecutado correctamente\n`);
      } else {
        console.warn(`  ⚠️ ${seedFile} no tiene método 'up'\n`);
      }
    }

    console.log("✅ Todas las seeds ejecutadas correctamente");
  } catch (error) {
    console.error("❌ Error al ejecutar seeds:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
runSeeds().catch((error) => {
  console.error(error);
  process.exit(1);
});
