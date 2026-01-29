import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";
import { HealthRepository } from "../repositories/HealthRepository";
import { HealthService } from "../services/HealthService";
import { config } from "../config";
import { InMemoryTokenStore } from "../services/InMemoryTokenStore";
import { EkaAuthService } from "../services/EkaAuthService";
import { WhatsAppService } from "../services/WhatsAppService";

export function registerDependencies(): void {
    container.register(DI_TOKENS.Config, { useValue: config });

    container.register(DI_TOKENS.TokenStore, { useClass: InMemoryTokenStore });

    container.register(DI_TOKENS.HealthRepository, { useClass: HealthRepository });

    container.register(DI_TOKENS.HealthService, { useClass: HealthService });
    container.register(DI_TOKENS.EkaAuthService, { useClass: EkaAuthService });
    container.register(DI_TOKENS.WhatsAppService, { useClass: WhatsAppService });

    console.log("Dependency Injection: All dependencies registered.");
}
