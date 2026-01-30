import { UserSession } from "../../types/SessionState";

export interface ISessionStore {
    getSession(userId: string): Promise<UserSession | null>;
    saveSession(userId: string, session: UserSession): Promise<void>;
    clearSession(userId: string): Promise<void>;
    updateState(userId: string, partialSession: Partial<UserSession>): Promise<void>;
}
