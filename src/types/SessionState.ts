export enum ConversationState {
    INIT = "INIT",
    MENU_SELECTION = "MENU_SELECTION",
    AWAITING_MOBILE_VIEW = "AWAITING_MOBILE_VIEW",
    AWAITING_MOBILE_UPLOAD = "AWAITING_MOBILE_UPLOAD", // For future use
    AWAITING_OTP = "AWAITING_OTP",
    LOGGED_IN = "LOGGED_IN"
}

export interface UserSession {
    mobileNumber?: string;
    txnId?: string;
    state: ConversationState;
    lastUpdated: number;
    tempData?: any; // For storing transient data like list of PHR addresses
}
