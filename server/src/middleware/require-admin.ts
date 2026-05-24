import { ErrorFactory } from "@/errors";
import { appAssert } from "@/utils";
import { verifyToken } from "@/utils/jwt";
import type { RequestHandler } from "express";
import type mongoose from "mongoose";
import UserModel from "../models/user.model"; // model User của bạn

// Middleware chỉ cho admin
const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    const accessToken = req.cookies.accessToken as string | undefined;
    appAssert(accessToken, ErrorFactory.invalidToken("Missing access token"));

    const { error, payload } = verifyToken(accessToken);
    appAssert(
      payload,
      error === "jwt expired" ? ErrorFactory.expiredToken() : ErrorFactory.invalidToken()
    );

    const user = await UserModel.findById(payload.userId as mongoose.Types.ObjectId).select("role");
    appAssert(user, ErrorFactory.resourceNotFound("User"));

    appAssert(
      user.role === "admin",
      ErrorFactory.forbiddenAction(undefined, "Access denied. Admin only")
    );
    (req as any).userId = user._id;
    next(); // user là admin => cho phép tiếp tục
  } catch (error) {
    next(error);
  }
};

export default requireAdmin;
