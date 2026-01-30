import { inject, injectable, container } from "tsyringe";
import { DI_TOKENS } from "../di/tokens";
import { IWhatsAppFlowService } from "./interfaces/IWhatsAppFlowService";
import { ISessionStore } from "./interfaces/ISessionStore";
import { IAbdmService } from "./interfaces/IAbdmService";
import { IWhatsAppService } from "./interfaces/IWhatsAppService";
import { IFhirService } from "./interfaces/IFhirService"; // Added import
import { ConversationState } from "../types/SessionState";
import { ProcessingStatus } from "../types/domain";

@injectable()
export class WhatsAppFlowService implements IWhatsAppFlowService {
    constructor(
        @inject(DI_TOKENS.SessionStore) private sessionStore: ISessionStore,
        @inject(DI_TOKENS.AbdmService) private abdmService: IAbdmService,
        @inject(DI_TOKENS.FhirService) private fhirService: IFhirService // Injected IFhirService
    ) { }

    // Helper to resolve WhatsAppService lazily to avoid circular dependency
    private get whatsappService(): IWhatsAppService {
        return container.resolve<IWhatsAppService>(DI_TOKENS.WhatsAppService);
    }

    public async handleMessage(from: string, messageType: string, content: any): Promise<void> {
        console.log(`▶️ [FlowService] handleMessage called for ${from}`);
        let session = await this.sessionStore.getSession(from);
        console.log(`ℹ️ [FlowService] Current Session State: ${session?.state || "NONE"}`);

        // Extract plain text body
        let textBody = "";
        if (messageType === "text" && content?.text?.body) {
            textBody = content.text.body.trim();
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
            case ConversationState.AWAITING_PROFILE_CONFIRMATION:
                await this.handleProfileConfirmation(from, textBody, session);
                break;
            case ConversationState.AWAITING_PRESCRIPTION_UPLOAD:
                if (messageType === 'image') {
                    await this.handleImageUpload(from, content, session);
                } else {
                    await this.whatsappService.sendTextMessage(from, "⚠️ Please upload an image file.");
                }
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
        console.log(`▶️ [FlowService] startConversation`);
        await this.sessionStore.saveSession(from, {
            state: ConversationState.MENU_SELECTION,
            lastUpdated: Date.now()
        });
        console.log(`💾 [FlowService] State saved: MENU_SELECTION`);
        await this.whatsappService.sendTextMessage(
            from,
            "👋 Welcome to ABHA Pocket!\n\nPlease select an option:\n1️⃣ View Details\n2️⃣ Upload Data"
        );
    }

    private async handleMenuSelection(from: string, type: string, text: string) {
        console.log(`▶️ [FlowService] handleMenuSelection. Input: ${text}`);
        if (text === "1") {
            await this.sessionStore.updateState(from, { state: ConversationState.AWAITING_MOBILE_VIEW });
            console.log(`💾 [FlowService] State updated: AWAITING_MOBILE_VIEW`);
            await this.whatsappService.sendTextMessage(from, "Please enter your 10-digit Mobile Number or ABHA Number to view details:");
        } else if (text === "2") {
            await this.sessionStore.updateState(from, { state: ConversationState.AWAITING_MOBILE_UPLOAD });
            console.log(`💾 [FlowService] State updated: AWAITING_MOBILE_UPLOAD`);
            await this.whatsappService.sendTextMessage(from, "Please enter your 10-digit Mobile Number or ABHA Number to upload data:");
        } else {
            console.warn(`⚠️ [FlowService] Invalid menu selection: ${text}`);
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

        // --- UPLOAD DATA FLOW ---
        if (currentState === ConversationState.AWAITING_MOBILE_UPLOAD) {
            console.log(`ℹ️ [FlowService] Upload flow - Fetching Profile for ${input}`);
            try {
                // 1. Fetch Profile
                const profiles = await this.abdmService.getProfileByMobile(input);
                if (!profiles || profiles.length === 0) {
                    await this.whatsappService.sendTextMessage(from, "❌ No profile found for this number. Please check and try again.");
                    return;
                }

                // 2. Select first profile (assuming single user mapping for simplicity or user picks first)
                const profile = profiles[0];
                console.log(`✅ [FlowService] Profile found: ${profile.fln}`);

                // 3. Store temp profile and ask for confirmation
                await this.sessionStore.updateState(from, {
                    state: ConversationState.AWAITING_PROFILE_CONFIRMATION,
                    mobileNumber: input,
                    tempData: profile // Store profile to display/use later
                });

                // 4. Send Confirmation Message
                const msg = `👤 **Profile Verified**\n\nName: ${profile.fln}\nABHA: ${profile.abha}\n\nIs this you?`;
                await this.whatsappService.sendInteractiveMessage(from, msg, [
                    { id: "yes_confirm", title: "Yes" },
                    { id: "no_retry", title: "No" }
                ]);

            } catch (error: any) {
                console.error(`❌ [FlowService] Fetch Profile Error: ${error.message}`);
                await this.whatsappService.sendTextMessage(from, "❌ Failed to fetch profile. Please try again later.");
                await this.startConversation(from);
            }
            return;
        }

        // --- VIEW DETAILS FLOW (Standard Login) ---
        try {
            await this.whatsappService.sendTextMessage(from, "⏳ Initiating login...");
            console.log(`📡 [FlowService] Calling AbdmService.initLogin for ${input}`);
            const txnId = await this.abdmService.initLogin(input);
            console.log(`✅ [FlowService] Init Login Success. TxnId: ${txnId}`);

            await this.sessionStore.updateState(from, {
                state: ConversationState.AWAITING_OTP,
                mobileNumber: input,
                txnId: txnId
            });
            console.log(`💾 [FlowService] State updated: AWAITING_OTP`);

            await this.whatsappService.sendTextMessage(from, `✅ OTP sent to ${input}.\n\nPlease enter the 6-digit OTP:`);
        } catch (error: any) {
            console.error(`❌ [FlowService] Login Init Failed: ${error.message}`);
            await this.whatsappService.sendTextMessage(from, `❌ Login failed: ${error.message}`);
            await this.startConversation(from);
        }
    }

    private async handleProfileConfirmation(from: string, input: string, session: any) {
        console.log(`▶️ [FlowService] handleProfileConfirmation. Input: ${input}`);
        const normalizedInput = input.trim().toLowerCase();

        if (normalizedInput === "yes" || normalizedInput === "y" || normalizedInput === "yes_confirm") {
            // YES -> Ask for Image
            await this.sessionStore.updateState(from, {
                state: ConversationState.AWAITING_PRESCRIPTION_UPLOAD
            });
            await this.whatsappService.sendTextMessage(from, "📸 Please upload an image of the prescription.");
        } else if (normalizedInput === "no" || normalizedInput === "n" || normalizedInput === "no_retry") {
            // NO -> Retry Mobile
            await this.sessionStore.updateState(from, {
                state: ConversationState.AWAITING_MOBILE_UPLOAD,
                tempData: undefined
            });
            await this.whatsappService.sendTextMessage(from, "🔄 Please re-enter the mobile number linked with your ABHA:");
        } else {
            // Invalid Input
            await this.whatsappService.sendInteractiveMessage(from, "⚠️ Please select an option:", [
                { id: "yes_confirm", title: "Yes" },
                { id: "no_retry", title: "No" }
            ]);
        }
    }

    private async handleImageUpload(from: string, messageContent: any, session: any) {
        console.log(`▶️ [FlowService] handleImageUpload`);

        // 1. Check if image exists
        const imageId = messageContent?.image?.id;
        if (!imageId) {
            await this.whatsappService.sendTextMessage(from, "⚠️ Please upload a valid image file.");
            return;
        }

        try {
            // 2. Notify User - Processing
            await this.whatsappService.sendTextMessage(from, "☕ Processing image... This may take a moment. Grab a cup of tea!");

            // 3. Download Image
            const imageBuffer = await this.whatsappService.downloadMedia(imageId);
            const imageBase64 = imageBuffer.toString("base64");

            // 4. Call ML Service
            const mlService = container.resolve<any>(DI_TOKENS.MlService); // Lazy resolve
            const mlResponse = await mlService.processImage(from, imageBase64); // Using 'from' (phone) as userId for now

            // 5. Convert to FHIR
            console.log(`⚕️ [FlowService] Converting extracted data to FHIR...`);
            const fhirBundle = await this.fhirService.mapToFhir(mlResponse, from);

            // 6. Save Result to DB
            const repo = container.resolve<any>(DI_TOKENS.MedicalRecordRepository);
            await repo.create({
                userUuid: from,
                fileUrl: "whatsapp_media_id_" + imageId, // Placeholder
                status: ProcessingStatus.FHIR_MAPPED,
                ocrOutput: mlResponse,
                fhirResource: fhirBundle, // Save FHIR bundle
                auditLog: [{ status: ProcessingStatus.FHIR_MAPPED, details: "Processed via WhatsApp Flow & FHIR Mapped" }]
            });

            // 7. Success Message
            await this.whatsappService.sendTextMessage(from, "✅ Analysis Complete! Your report has been successfully uploaded");

            // 8. Send Structured Summary
            const extracted = mlResponse.extracted_data || {};
            let summaryMsg = "📄 *Prescription Summary*\n";

            if (extracted.diagnosis) {
                summaryMsg += `\n🩺 *Diagnosis:* ${extracted.diagnosis}`;
            }

            if (extracted.medications && extracted.medications.length > 0) {
                summaryMsg += `\n\n💊 *Medications:*`;
                extracted.medications.forEach((m: any) => {
                    const details = [m.dosage, m.frequency, m.duration].filter(d => d).join(", ");
                    summaryMsg += `\n- ${m.name}${details ? ` (${details})` : ""}`;
                });
            }

            if (extracted.tests_ordered && extracted.tests_ordered.length > 0) {
                summaryMsg += `\n\n🧪 *Tests Ordered:*`;
                extracted.tests_ordered.forEach((t: string) => {
                    summaryMsg += `\n- ${t}`;
                });
            }

            await this.whatsappService.sendTextMessage(from, summaryMsg);

            await this.startConversation(from); // Reset

        } catch (error: any) {
            console.error(`❌ [FlowService] Image Processing Failed: ${error.message}`);
            await this.whatsappService.sendTextMessage(from, "❌ Failed to process prescription. Please try again.");
        }
    }

    private async handleOtpInput(from: string, otp: string, txnId: string) {
        console.log(`▶️ [FlowService] handleOtpInput.`);
        if (!/^\d{6}$/.test(otp)) {
            console.warn(`⚠️ [FlowService] Invalid OTP format`);
            await this.whatsappService.sendTextMessage(from, "⚠️ Invalid OTP format. Please enter a 6-digit code.");
            return;
        }

        try {
            await this.whatsappService.sendTextMessage(from, "⏳ Verifying OTP...");

            // API 2: Verify
            console.log(`📡 [FlowService] Calling AbdmService.verifyOtp`);
            const verifyResponse = await this.abdmService.verifyOtp(txnId, otp);
            console.log(`✅ [FlowService] OTP Verified. Requesting Profile Link...`);

            // API 3: Link/Login
            if (verifyResponse.profiles.length === 0) {
                throw new Error("No ABHA linked to this number. Please create one first.");
            }

            const selectedProfile = verifyResponse.profiles[0];
            console.log(`📡 [FlowService] Calling AbdmService.linkPhr for ${selectedProfile.abha_address}`);
            const profileDetails = await this.abdmService.linkPhr(txnId, selectedProfile.abha_address);
            console.log(`✅ [FlowService] PHR Linked Successfully`);

            await this.sessionStore.updateState(from, {
                state: ConversationState.LOGGED_IN,
                tempData: profileDetails
            });
            console.log(`💾 [FlowService] State updated: LOGGED_IN`);

            const msg = `🎉 **Login Success!**\n\nName: ${profileDetails.first_name} ${profileDetails.last_name}\nABHA: ${profileDetails.abha_address}\nMobile: ${profileDetails.mobile}`;
            await this.whatsappService.sendTextMessage(from, msg);

        } catch (error: any) {
            console.error(`❌ [FlowService] OTP Verification/Linking Failed: ${error.message}`);
            await this.whatsappService.sendTextMessage(from, `❌ Verification failed: ${error.message}\n\nPlease enter OTP again or type 'Hi' to restart.`);
        }
    }
}
