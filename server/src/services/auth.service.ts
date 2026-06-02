import { PROVIDERS } from "../constants";
import { ErrorFactory } from "../errors";
import { SessionModel, UserModel } from "../models";
import VerificationService from "../services/verification.service";
import {
  appAssert,
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
  hashValue,
  ONE_DAY_MS,
  oneWeekFromNow,
  REFRESH_TOKEN_OPTIONS,
  RefreshTokenPayload,
  sendMail,
  signToken,
  verifyToken,
} from "../utils";
import type { CreateAccountParams, LoginParams } from "../validators";

type GoogleParams = {
  email: string;
  username: string;
  avatarUrl?: string;
  googleId: string;
  userAgent: string;
};

export default class AuthService {
  constructor(private readonly verificationService: VerificationService) { }

  /**
   * Sends a verification email to the user.
   */
  async sendEmailVerification(email: string) {
    const user = await UserModel.findOne({ email });
    appAssert(user, ErrorFactory.resourceNotFound("User"));

    // Check rate limit (handled by Redis)
    const canSend = await this.verificationService.checkRateLimit(email);
    appAssert(canSend, ErrorFactory.tooManyRequests());

    // Generate verification code and store in Redis
    const code = await this.verificationService.createEmailVerification(email);

    // Send email with verification code
    const { error } = await sendMail({
      to: email,
      ...getVerifyEmailTemplate(code),
    });

    appAssert(!error, ErrorFactory.internalError("Failed to send verification email"));

    return { message: "Verification email sent successfully" };
  }

  /**
   * Creates a new user account.
   */
  async createAccount({ email, username, password }: CreateAccountParams) {
    const existingUser = await UserModel.exists({ email });
    appAssert(!existingUser, ErrorFactory.resourceExists("Email"));

    const user = await UserModel.create({
      email,
      username,
      password,
    });

    await this.sendEmailVerification(user.email);

    return {
      message: "Account created successfully. Please check your email to verify your account.",
      user: user.omitPassword(),
    };
  }

  /**
   * Logs in a user.
   */
  async loginUser({ email, password, userAgent }: LoginParams) {
    const user = await UserModel.findOne({ email });
    appAssert(user, ErrorFactory.invalidCredentials());

    const isValid = await user.comparePassword(password);
    appAssert(isValid, ErrorFactory.invalidCredentials());

    appAssert(user.isVerified, ErrorFactory.emailNotVerified());

    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    const sessionInfo: RefreshTokenPayload = {
      sessionId: session._id,
    };

    const refreshToken = signToken(sessionInfo, REFRESH_TOKEN_OPTIONS);
    const accessToken = signToken({
      ...sessionInfo,
      userId: user._id,
    });

    return {
      user: user.omitPassword(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logs in or registers a user using Google OAuth.
   */
  async loginWithGoogle({ email, username, avatarUrl, googleId, userAgent }: GoogleParams) {
    let user = await UserModel.findOne({ email });

    if (!user) {
      user = await UserModel.create({
        email,
        username,
        provider: PROVIDERS.GOOGLE,
        isVerified: true,
        avatarUrl,
        googleId,
      });
    } else {
      // update existing user
      if (user.provider === PROVIDERS.LOCAL) {
        user.provider = PROVIDERS.GOOGLE_LOCAL;
        if (avatarUrl) user.avatarUrl = avatarUrl;
        user.googleId = googleId;
        await user.save();
      } else if (user.provider === PROVIDERS.GOOGLE || user.provider === PROVIDERS.GOOGLE_LOCAL) {
        if (avatarUrl && user.avatarUrl !== avatarUrl) user.avatarUrl = avatarUrl;
        if (user.googleId !== googleId) user.googleId = googleId;
        if (!user.username || user.username === "Google User") user.username = username;
        if (user.isModified()) await user.save();
      }
    }

    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    const sessionInfo: RefreshTokenPayload = {
      sessionId: session._id,
    };

    const refreshToken = signToken(sessionInfo, REFRESH_TOKEN_OPTIONS);
    const accessToken = signToken({
      ...sessionInfo,
      userId: user._id,
    });

    return {
      user: user.omitPassword(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verifies a user's email using a verification code.
   */
  async verifyEmail(email: string, code: string) {
    // Xác thực code từ Redis
    const isValid = await this.verificationService.verifyEmailCode(email, code);
    appAssert(isValid, ErrorFactory.invalidVerificationCode());

    // Cập nhật user
    const updatedUser = await UserModel.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );
    appAssert(updatedUser, ErrorFactory.resourceNotFound("User"));

    return {
      user: updatedUser.omitPassword(),
    };
  }

  /**
   * Verifies a password reset code.
   */
  async verifyPasswordResetCode(email: string, code: string) {
    const user = await UserModel.findOne({ email });
    appAssert(user, ErrorFactory.resourceNotFound("User"));

    const isValid = await this.verificationService.verifyPasswordResetCode(email, code);
    appAssert(isValid, ErrorFactory.invalidVerificationCode());

    return {
      message: "Password reset code verified successfully",
    };
  }

  /**
   * Refreshes a user's access token using a refresh token.
   */
  async refreshUserAccessToken(refreshToken: string) {
    const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
      secret: REFRESH_TOKEN_OPTIONS.secret,
    });
    appAssert(payload, ErrorFactory.invalidToken("Invalid refresh token"));

    // validate session is deleted or expired
    const session = await SessionModel.findById(payload.sessionId);
    const now = Date.now();
    appAssert(
      session && session.expiresAt.getTime() > now,
      ErrorFactory.invalidToken("Session expired")
    );

    // refresh the session if it expires in the next 24hrs
    const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
    if (sessionNeedsRefresh) {
      session.expiresAt = oneWeekFromNow();
      await session.save();
    }

    const newRefreshToken = sessionNeedsRefresh
      ? signToken(
        {
          sessionId: session._id,
        },
        REFRESH_TOKEN_OPTIONS
      )
      : undefined;

    const accessToken = signToken({
      userId: session.userId,
      sessionId: session._id,
    });

    return {
      accessToken,
      newRefreshToken,
    };
  }

  /**
   * Sends a password reset email to the user.
   */
  async sendPasswordResetEmail(email: string) {
    const user = await UserModel.findOne({ email });
    appAssert(user, ErrorFactory.resourceNotFound("User"));

    // Check rate limit (handled by Redis)
    const canSend = await this.verificationService.checkRateLimit(email);
    appAssert(canSend, ErrorFactory.tooManyRequests());

    // Generate password reset code and store in Redis (TTL: 15 minutes)
    const code = await this.verificationService.createPasswordReset(email);

    // Send email with reset code
    const { data, error } = await sendMail({
      to: email,
      ...getPasswordResetTemplate(code),
    });

    appAssert(data?.id, ErrorFactory.internalError(`${error?.name} - ${error?.message}`));

    return {
      message: "Password reset email sent successfully",
      emailId: data.id,
    };
  }

  /**
   * Resets a user's password using a verification code.
   */
  async resetPassword({ email, password }: { email: string; password: string }) {
    // Update password
    const updatedUser = await UserModel.findOneAndUpdate(
      { email },
      { password: await hashValue(password) },
      { new: true }
    );
    appAssert(updatedUser, ErrorFactory.resourceNotFound("User"));

    // Delete all user sessions
    await SessionModel.deleteMany({ userId: updatedUser._id });

    return { user: updatedUser.omitPassword() };
  }

  /**
   * Logs out a user by deleting their session.
   */
  async logoutUser(sessionId: string) {
    await SessionModel.findByIdAndDelete(sessionId);
  }

  /**
   * Changes a user's password.
   * Requires current password verification.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await UserModel.findById(userId);
    appAssert(user, ErrorFactory.resourceNotFound("User"));

    // Check if user can change password (not OAuth-only user)
    appAssert(
      user.password,
      ErrorFactory.badRequest("Cannot change password for OAuth-only accounts")
    );

    const isValid = await user.comparePassword(currentPassword);
    appAssert(isValid, ErrorFactory.invalidCredentials("Current password is incorrect"));

    user.password = newPassword;
    await user.save();

    // Delete all other sessions (keep current one optional)
    await SessionModel.deleteMany({ userId: user._id });

    return { user: user.omitPassword() };
  }
}
