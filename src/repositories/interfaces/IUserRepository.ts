import { IUser } from "../../types/domain";

export interface IUserRepository {
    create(user: Omit<IUser, "uuid" | "createdAt" | "updatedAt">): Promise<IUser>;
    findByPhoneNumber(phoneNumber: string): Promise<IUser | null>;
    findByAbhaId(abhaId: string): Promise<IUser | null>;
    findByUuid(uuid: string): Promise<IUser | null>;
    update(uuid: string, updates: Partial<IUser>): Promise<IUser | null>;
}
