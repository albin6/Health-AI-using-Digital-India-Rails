import "reflect-metadata";
import express from "express";
import { registerDependencies } from "./di/register";
import { registerHealthRoutes } from "./routes/health.routes";
import { registerWhatsAppRoutes } from "./routes/whatsapp.routes";

registerDependencies();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/health", registerHealthRoutes());
app.use("/webhook", registerWhatsAppRoutes());

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
