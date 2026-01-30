import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";
import { config } from "../config";

// Legacy/Existing Imports
import { HealthRepository } from "../repositories/HealthRepository";
import { HealthService } from "../services/HealthService";
import { InMemoryTokenStore } from "../services/InMemoryTokenStore";
import { InMemorySessionStore } from "../services/InMemorySessionStore";
import { EkaAuthService } from "../services/EkaAuthService";
import { AbdmService } from "../services/AbdmService";
import { WhatsAppFlowService } from "../services/WhatsAppFlowService";
import { WhatsAppService } from "../services/WhatsAppService";

// New Architecture Imports
import { MongoUserRepository } from "../repositories/MongoUserRepository";
import { MongoMedicalRecordRepository } from "../repositories/MongoMedicalRecordRepository";
import { MedicalRecordService } from "../services/MedicalRecordService";
import { MockMaskingService } from "../services/MockMaskingService";
import { MockOcrService } from "../services/MockOcrService";
import { SimpleFhirService } from "../services/SimpleFhirService";

export function registerDependencies(): void {
    container.register(DI_TOKENS.Config, { useValue: config }); 

    // Core Services (Stores) - Ideally replace with Mongo/Redis later
    container.register(DI_TOKENS.TokenStore, { useClass: InMemoryTokenStore });
    container.register(DI_TOKENS.SessionStore, { useClass: InMemorySessionStore });

    // Existing Flows
    container.register(DI_TOKENS.HealthRepository, { useClass: HealthRepository });
    container.register(DI_TOKENS.HealthService, { useClass: HealthService });
    container.register(DI_TOKENS.EkaAuthService, { useClass: EkaAuthService });
    container.register(DI_TOKENS.AbdmService, { useClass: AbdmService });
    container.register(DI_TOKENS.WhatsAppFlowService, { useClass: WhatsAppFlowService });
    container.register(DI_TOKENS.WhatsAppService, { useClass: WhatsAppService });

    // New Clean Architecture Implementations
    container.register(DI_TOKENS.UserRepository, { useClass: MongoUserRepository });
    container.register(DI_TOKENS.MedicalRecordRepository, { useClass: MongoMedicalRecordRepository });
    
    container.register(DI_TOKENS.MaskingService, { useClass: MockMaskingService });
    container.register(DI_TOKENS.OcrService, { useClass: MockOcrService });
    container.register(DI_TOKENS.FhirService, { useClass: SimpleFhirService });
    
    container.register(DI_TOKENS.MedicalRecordService, { useClass: MedicalRecordService });

    console.log("Dependency Injection: All dependencies registered.");
}
