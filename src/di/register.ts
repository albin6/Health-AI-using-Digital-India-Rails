import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";
import { HealthRepository } from "../repositories/HealthRepository";
import { HealthService } from "../services/HealthService";
import { config } from "../config";

export function registerDependencies(): void {
    // Config
    container.register(DI_TOKENS.Config, { useValue: config });

    // Repositories
    container.register(DI_TOKENS.HealthRepository, { useClass: HealthRepository });

    // Services
    container.register(DI_TOKENS.HealthService, { useClass: HealthService });

    console.log("Dependency Injection: All dependencies registered.");
}
