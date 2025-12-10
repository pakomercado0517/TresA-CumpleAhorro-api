// Cargar variables de entorno primero
import "../src/config/env.config";

import { createDatabaseIfNotExists } from "../src/utils/create-database.util";

createDatabaseIfNotExists()
  .then(() => {
    console.log("✅ Proceso completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

