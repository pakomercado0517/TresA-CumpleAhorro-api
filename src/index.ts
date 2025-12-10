// Cargar y validar variables de entorno PRIMERO
import "./config/env.config";

import app from "./server";
import { initializeDatabase } from "./utils/database.util";

const port = parseInt(process.env["PORT"] ?? "3001", 10);

const startServer = async (): Promise<void> => {
  try {
    // Inicializar conexión a la base de datos
    await initializeDatabase();

    // Iniciar servidor
    app.listen(port, () => {
      console.warn(`🚀 Servidor corriendo en el puerto ${port}`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    throw error;
  }
};

void startServer();
