import { injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import { IUserRepository } from "./interfaces/IUserRepository";
import { IUser } from "../types/domain";
import { UserModel } from "../models/User.model";

@injectable()
export class MongoUserRepository implements IUserRepository {
    async create(userData: Omit<IUser, "uuid" | "createdAt" | "updatedAt">): Promise<IUser> {
        const uuid = uuidv4();
        const user = await UserModel.create({ ...userData, uuid });
        return user.toObject() as IUser;
    }

    async findByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ phoneNumber });
        return user ? (user.toObject() as IUser) : null;
    }

    async findByAbhaId(abhaId: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ abhaId });
        return user ? (user.toObject() as IUser) : null;
    }

    async findByUuid(uuid: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ uuid });
        return user ? (user.toObject() as IUser) : null;
    }

    async update(uuid: string, updates: Partial<IUser>): Promise<IUser | null> {
        const user = await UserModel.findOneAndUpdate(
            { uuid },
            { $set: updates },
            { new: true }
        );
        return user ? (user.toObject() as IUser) : null;
    }
}
