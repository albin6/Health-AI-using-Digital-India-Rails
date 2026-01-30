export const DI_TOKENS = {
    // Repositories
    HealthRepository: Symbol.for("HealthRepository"),

    // Services
    HealthService: Symbol.for("HealthService"),
    EkaAuthService: Symbol.for("EkaAuthService"),
    TokenStore: Symbol.for("TokenStore"),
    SessionStore: Symbol.for("SessionStore"),
    AbdmService: Symbol.for("AbdmService"),
    WhatsAppFlowService: Symbol.for("WhatsAppFlowService"),
    WhatsAppService: Symbol.for("WhatsAppService"),

    // External/Config
    Config: Symbol.for("Config"),
};
