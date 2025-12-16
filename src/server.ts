import cors from "cors";
import express, { Application } from "express";
import morgan from "morgan";

import { env } from "./config/env.config";
import { apiRateLimiter } from "./middlewares/rate-limit.middleware";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import eventRoutes from "./routes/event.routes";
import groupRoutes from "./routes/group.routes";
import memberRoutes from "./routes/member.routes";
import paymentRoutes from "./routes/payment.routes";
import userRoutes from "./routes/user.routes";

const app: Application = express();

// Middlewares globales
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: env.FRONTEND_URL
  })
);

// Rate limiting global (solo en producción)
app.use(apiRateLimiter);

// Routes
app.get("/", (req, res) => {
  res.send({ message: "API Tanda Cumpleaños funcionando correctamente" });
});

app.use("/api/auth", authRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api", memberRoutes);
app.use("/api", eventRoutes);
app.use("/api", paymentRoutes);

export default app;
