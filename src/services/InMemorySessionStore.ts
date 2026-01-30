import { injectable } from "tsyringe";
import { ISessionStore } from "./interfaces/ISessionStore";
import { UserSession } from "../types/SessionState";

@injectable()
export class InMemorySessionStore implements ISessionStore {
    private sessions: Map<string, UserSession> = new Map();

    public async getSession(userId: string): Promise<UserSession | null> {
        return this.sessions.get(userId) || null;
    }

    public async saveSession(userId: string, session: UserSession): Promise<void> {
        this.sessions.set(userId, session);
    }

    public async clearSession(userId: string): Promise<void> {
        this.sessions.delete(userId);
    }

    public async updateState(userId: string, partialSession: Partial<UserSession>): Promise<void> {
        const current = this.sessions.get(userId);
        if (current) {
            this.sessions.set(userId, { ...current, ...partialSession, lastUpdated: Date.now() });
        }
    }
}
