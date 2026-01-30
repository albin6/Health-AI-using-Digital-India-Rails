import "reflect-metadata";
import express from "express";
import { registerDependencies } from "./di/register";
import { registerHealthRoutes } from "./routes/health.routes";
import { registerWhatsAppRoutes } from "./routes/whatsapp.routes";
import { registerMedicalRoutes } from "./routes/medical.routes";
import { connectDatabase } from "./config/database";

const startServer = async () => {
    try {
        await connectDatabase();

        registerDependencies();

        const app = express();
        const PORT = process.env.PORT || 3000;

        app.use(express.json());

        app.use("/health", registerHealthRoutes());
        app.use("/webhook", registerWhatsAppRoutes());
        app.use("/medical-records", registerMedicalRoutes());

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
