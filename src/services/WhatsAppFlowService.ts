import { inject, injectable, container } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IWhatsAppFlowService } from "./interfaces/IWhatsAppFlowService";
import { ISessionStore } from "./interfaces/ISessionStore";
import { IAbdmService } from "./interfaces/IAbdmService";
import { IWhatsAppService } from "./interfaces/IWhatsAppService";
import { ConversationState } from "../types/SessionState";

@injectable()
export class WhatsAppFlowService implements IWhatsAppFlowService {
    constructor(
        @inject(DI_TOKENS.SessionStore) private sessionStore: ISessionStore,
        @inject(DI_TOKENS.AbdmService) private abdmService: IAbdmService
    ) { }

    // Helper to resolve WhatsAppService lazily to avoid circular dependency
    private get whatsappService(): IWhatsAppService {
        return container.resolve<IWhatsAppService>(DI_TOKENS.WhatsAppService);
    }

    public async handleMessage(from: string, messageType: string, content: any): Promise<void> {
        console.log(`▶️ [FlowService] handleMessage called for ${from}`);
        let session = await this.sessionStore.getSession(from);
        console.log(`ℹ️ [FlowService] Current Session State: ${session?.state || "NONE"}`);

        // Extract plain text body or interactive button response
        let textBody = "";
        if (messageType === "text" && content?.text?.body) {
            textBody = content.text.body.trim();
        } else if (messageType === "interactive" && content?.interactive?.button_reply) {
            textBody = content.interactive.button_reply.id; // Or title
        }

        console.log(`📝 [FlowService] Extracted Text: "${textBody}"`);

        // Auto-start for new users or explicit "Hi"
        if (!session || (messageType === "text" && (textBody.toLowerCase() === "hi" || textBody.toLowerCase() === "hello"))) {
            console.log("👋 [FlowService] Starting new conversation");
            await this.startConversation(from);
            return;
        }

        console.log(`🔄 [FlowService] Routing based on state: ${session.state}`);
        switch (session.state) {
            case ConversationState.MENU_SELECTION:
                await this.handleMenuSelection(from, messageType, textBody);
                break;
            case ConversationState.AWAITING_MOBILE_VIEW:
            case ConversationState.AWAITING_MOBILE_UPLOAD:
                await this.handleMobileInput(from, textBody, session.state);
                break;
            case ConversationState.AWAITING_OTP:
                await this.handleOtpInput(from, textBody, session.txnId!);
                break;
            case ConversationState.LOGGED_IN:
                console.log("ℹ️ [FlowService] User already logged in");
                await this.whatsappService.sendTextMessage(from, "You are already logged in. Type 'Hi' to restart.");
                break;
            default:
                console.warn(`⚠️ [FlowService] Unknown state: ${session.state}, restarting.`);
                await this.startConversation(from);
                break;
        }
        console.log(`⏹️ [FlowService] handleMessage processing finished`);
    }

    private async startConversation(from: string) {
        await this.sessionStore.saveSession(from, {
            state: ConversationState.MENU_SELECTION,
            lastUpdated: Date.now()
        });
        await this.whatsappService.sendTextMessage(
            from,
            "👋 Welcome to Health AI!\n\nPlease select an option:\n1️⃣ View Details\n2️⃣ Upload Data"
        );
    }

    private async handleMenuSelection(from: string, type: string, text: string) {
        console.log(`▶️ [FlowService] handleMenuSelection. Input: ${text}`);
        if (text === "1") {
            await this.sessionStore.updateState(from, { state: ConversationState.AWAITING_MOBILE_VIEW });
            await this.whatsappService.sendTextMessage(from, "Please enter your 10-digit Mobile Number or ABHA Number to view details:");
        } else if (text === "2") {
            await this.sessionStore.updateState(from, { state: ConversationState.AWAITING_MOBILE_UPLOAD });
            await this.whatsappService.sendTextMessage(from, "Please enter your 10-digit Mobile Number or ABHA Number to upload data:");
        } else {
            await this.whatsappService.sendTextMessage(from, "🚫 Invalid input. Please reply with '1' or '2'.");
        }
    }

    private async handleMobileInput(from: string, input: string, currentState: ConversationState) {
        console.log(`▶️ [FlowService] handleMobileInput. Validating input...`);
        // Validation: 10 digits (Mobile) or 14 digits (ABHA Number)
        if (!/^\d{10}$/.test(input) && !/^\d{14}$/.test(input)) {
            console.warn(`⚠️ [FlowService] Invalid input format: ${input}`);
            await this.whatsappService.sendTextMessage(from, "⚠️ Invalid format. Please enter a valid 10-digit Mobile Number or 14-digit ABHA Number.");
            return;
        }

        if (currentState === ConversationState.AWAITING_MOBILE_UPLOAD) {
            // Requirement: "Stop there"
            await this.whatsappService.sendTextMessage(from, "✅ Mobile received. Upload feature coming soon!");
            // Reset or keep state? Let's reset to avoid stuck state.
            await this.sessionStore.clearSession(from);
            return;
        }

        // View Details Flow
        try {
            await this.whatsappService.sendTextMessage(from, "⏳ Initiating login...");
            const txnId = await this.abdmService.initLogin(input);
            console.log("Txn Generated:", txnId);

            await this.sessionStore.updateState(from, {
                state: ConversationState.AWAITING_OTP,
                mobileNumber: input,
                txnId: txnId
            });

            await this.whatsappService.sendTextMessage(from, `✅ OTP sent to ${input}.\n\nPlease enter the 6-digit OTP:`);
        } catch (error: any) {
            console.error(`❌ [FlowService] Login Init Failed: ${error.message}`);
            // Send error but keep session open or reset to known state
            await this.whatsappService.sendTextMessage(from, `❌ Login failed: ${error.message}`);

            // Should we restart? The user screenshot shows "Welcome..." immediately after error.
            // Let's reset to menu state but NOT send the welcome message again to avoid spam loop.
            // Or maybe just ask them to try again?
            // "Please create ABHA address first." -> User needs to do something external.

            // Best approach: Reset to MENU so they can choose again (or try number again)
            await this.startConversation(from);
        }
    }

    private async handleOtpInput(from: string, otp: string, txnId: string) {
        console.log(`▶️ [FlowService] handleOtpInput.`);
        if (!/^\d{6}$/.test(otp)) {
            await this.whatsappService.sendTextMessage(from, "⚠️ Invalid OTP format. Please enter a 6-digit code.");
            return;
        }

        try {
            await this.whatsappService.sendTextMessage(from, "⏳ Verifying OTP...");

            // API 2: Verify
            const verifyResponse = await this.abdmService.verifyOtp(txnId, otp);

            // API 3: Link/Login (Taking first profile automatically as simplified flow)
            if (verifyResponse.profiles.length === 0) {
                throw new Error("No ABHA linked to this number. Please create one first.");
            }

            const selectedProfile = verifyResponse.profiles[0];
            const profileDetails = await this.abdmService.linkPhr(txnId, selectedProfile.abha_address);

            await this.sessionStore.updateState(from, {
                state: ConversationState.LOGGED_IN,
                tempData: profileDetails
            });

            const msg = `🎉 **Login Success!**\n\nName: ${profileDetails.first_name} ${profileDetails.last_name}\nABHA: ${profileDetails.abha_address}\nMobile: ${profileDetails.mobile}`;
            await this.whatsappService.sendTextMessage(from, msg);

        } catch (error: any) {
            await this.whatsappService.sendTextMessage(from, `❌ Verification failed: ${error.message}\n\nPlease enter OTP again or type 'Hi' to restart.`);
        }
    }
}
