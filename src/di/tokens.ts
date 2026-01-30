export const DI_TOKENS = {
    // Repositories
    HealthRepository: Symbol.for("HealthRepository"),
    UserRepository: Symbol.for("UserRepository"),
    MedicalRecordRepository: Symbol.for("MedicalRecordRepository"),

    // Services
    HealthService: Symbol.for("HealthService"),
    EkaAuthService: Symbol.for("EkaAuthService"),
    TokenStore: Symbol.for("TokenStore"),
    SessionStore: Symbol.for("SessionStore"),
    AbdmService: Symbol.for("AbdmService"),
    WhatsAppFlowService: Symbol.for("WhatsAppFlowService"),
    WhatsAppService: Symbol.for("WhatsAppService"),

    // New Services
    MedicalRecordService: Symbol.for("MedicalRecordService"),
    MaskingService: Symbol.for("MaskingService"),
    OcrService: Symbol.for("OcrService"),
    FhirService: Symbol.for("FhirService"),

    // External/Config
    Config: Symbol.for("Config"),

    // New Services
    MlService: Symbol.for("MlService"),
};
