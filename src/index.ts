import "reflect-metadata"; // Must be first
import express from "express";
import { registerDependencies } from "./di/register";
import { registerHealthRoutes } from "./routes/health.routes";
import { registerWhatsAppRoutes } from "./routes/whatsapp.routes";

// 1. Initialize DI
registerDependencies();

// 2. Setup Express
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 3. Register Routes
app.use("/health", registerHealthRoutes());
app.use("/webhook", registerWhatsAppRoutes());

// 4. Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
