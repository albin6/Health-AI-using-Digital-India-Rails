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
        let session = await this.sessionStore.getSession(from);

        // Auto-start for new users or explicit "Hi"
        if (!session || (messageType === "text" && content?.body?.toLowerCase() === "hi")) {
            await this.startConversation(from);
            return;
        }

        switch (session.state) {
            case ConversationState.MENU_SELECTION:
                await this.handleMenuSelection(from, messageType, content);
                break;
            case ConversationState.AWAITING_MOBILE_VIEW:
            case ConversationState.AWAITING_MOBILE_UPLOAD:
                await this.handleMobileInput(from, content, session.state);
                break;
            case ConversationState.AWAITING_OTP:
                await this.handleOtpInput(from, content, session.txnId!);
                break;
            case ConversationState.LOGGED_IN:
                await this.whatsappService.sendTextMessage(from, "You are already logged in. Type 'Hi' to restart.");
                break;
            default:
                await this.startConversation(from);
                break;
        }
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

    private async handleMenuSelection(from: string, type: string, content: any) {
        const text = content?.body?.trim();
        console.log("Menu Selection:", text);
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

    private async handleMobileInput(from: string, content: any, currentState: ConversationState) {
        const input = content?.body?.trim();
        // Basic validation: 10 digits (Mobile) or 14 digits (ABHA). Let's assume user enters Mobile for API 1.
        if (!/^\d{10}$/.test(input)) {
            await this.whatsappService.sendTextMessage(from, "⚠️ Invalid format. Please enter a valid 10-digit mobile number.");
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
            await this.whatsappService.sendTextMessage(from, `❌ Login failed: ${error.message}`);
            // Restart
            await this.startConversation(from);
        }
    }

    private async handleOtpInput(from: string, content: any, txnId: string) {
        const otp = content?.body?.trim();
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
