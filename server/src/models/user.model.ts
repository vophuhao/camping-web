import { DEFAULT_AVATAR, PROVIDERS, ROLES, type Provider, type Role } from "../constants";
import { compareValue, hashValue } from "../utils";
import mongoose from "mongoose";

export interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  username: string;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
  isVerified: boolean;
  provider: Provider;
  googleId?: string;
  isBlocked?: boolean;

  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Omit<UserDocument, "password">;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (this: UserDocument) {
        return this.provider === PROVIDERS.LOCAL;
      },
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30,
      match: /^[\p{L}\p{N}._\s]+$/u,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    avatarUrl: {
      type: String,
      default: DEFAULT_AVATAR,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    isVerified: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: Object.values(PROVIDERS),
      default: PROVIDERS.LOCAL,
    },
    googleId: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Cho phép nhiều giá trị null khi sử dụng unique: true
    },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // Tự động tạo username từ email nếu chưa có username
  if (!this.username || this.username === "User") {
    this.username = this.email ? this.email.split("@")[0]! : "User";
  }

  if (!this.isModified("password") || !this.password) {
    return next();
  }

  this.password = await hashValue(this.password);
  return next();
});

userSchema.methods.comparePassword = async function (val: string) {
  return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
