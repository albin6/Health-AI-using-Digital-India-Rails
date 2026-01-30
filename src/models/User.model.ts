import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../types/domain";

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema({
    uuid: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    oid: { type: String },
    abhaId: { type: String }
}, { timestamps: true });

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);
