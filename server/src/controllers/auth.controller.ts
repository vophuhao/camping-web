import { catchErrors, ErrorFactory } from "@/errors";
import AuthService from "@/services/auth.service";
import {
  appAssert,
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  ResponseUtil,
  setAuthCookies,
  verifyToken,
} from "../utils";
import { emailSchema, loginSchema, registerSchema } from "@/validators";

export default class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Send email verification
   * @route POST /email/verification
   */
  sendEmailVerificationHandler = catchErrors(async (req, res) => {
    const email = emailSchema.parse(req.body.email);

    await this.authService.sendEmailVerification(email);

    return ResponseUtil.success(res, undefined, "Verification email sent");
  });

  /**
   * Register a new user
   * @route POST /register
   */
  registerHandler = catchErrors(async (req, res) => {
    const request = registerSchema.parse({
      ...req.body,
      userAgent: req.headers["user-agent"] || undefined,
    });

    const result = await this.authService.createAccount(request);

    return ResponseUtil.created(res, result.user, result.message);
  });

  /**
   * Login with Google
   * @route POST /login/google
   */
  googleLoginHandler = catchErrors(async (req, res) => {
    const { email, name, picture, googleId } = req.body;

    // Validate required fields
    appAssert(email, ErrorFactory.requiredField("email"));
    appAssert(googleId, ErrorFactory.requiredField("Google ID"));

    const userAgentRaw = req.headers["user-agent"];
    const userAgent = Array.isArray(userAgentRaw)
      ? userAgentRaw.join(" ")
      : userAgentRaw || "unknown";

    const { user, accessToken, refreshToken } = await this.authService.loginWithGoogle({
      email,
      username: name || "Google User",
      avatarUrl: picture,
      googleId, // Thêm googleId để identify user
      userAgent,
    });

    return ResponseUtil.success(
      setAuthCookies({ res, accessToken, refreshToken }),
      user,
      "Google login successful"
    );
  });

  /**
   * Login user
   * @route POST /login
   */
  loginHandler = catchErrors(async (req, res) => {
    const request = loginSchema.parse({
      ...req.body,
      userAgent: req.headers["user-agent"] || undefined,
    });

    const { user, accessToken, refreshToken } = await this.authService.loginUser(request);

    return ResponseUtil.success(
      setAuthCookies({ res, accessToken, refreshToken }),
      user,
      "Login successful"
    );
  });

  /**
   * Logout user
   * @route POST /logout
   */
  logoutHandler = catchErrors(async (req, res) => {
    const accessToken = req.cookies.accessToken as string | undefined;
    const { payload } = verifyToken(accessToken || "");

    if (payload) {
      // remove session from db
      await this.authService.logoutUser(payload.sessionId.toString());
    }

    // clear cookies
    return ResponseUtil.success(clearAuthCookies(res), undefined, "Logout successful");
  });

  /**
   * Refresh access token
   * @route GET /refresh
   */
  refreshHandler = catchErrors(async (req, res) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    appAssert(refreshToken, ErrorFactory.invalidToken("Missing refresh token"));

    const { accessToken, newRefreshToken } =
      await this.authService.refreshUserAccessToken(refreshToken);

    if (newRefreshToken) {
      res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
    }

    return ResponseUtil.success(
      res.cookie("accessToken", accessToken, getAccessTokenCookieOptions()),
      undefined,
      "Access token refreshed"
    );
  });

  /**
   * Verify email
   * @route POST /email/verify
   */
  verifyEmailHandler = catchErrors(async (req, res) => {
    const { email, code } = req.body;

    appAssert(email, ErrorFactory.requiredField("email"));
    appAssert(code, ErrorFactory.requiredField("Verification code"));

    const result = await this.authService.verifyEmail(email, code);

    return ResponseUtil.success(res, result.user, "Email was successfully verified");
  });

  /**
   * Verify password reset code
   * @route POST /password/verify
   */
  verifyPasswordResetCodeHandler = catchErrors(async (req, res) => {
    const { email, code } = req.body;

    appAssert(email, ErrorFactory.requiredField("email"));
    appAssert(code, ErrorFactory.requiredField("Verification code"));

    const result = await this.authService.verifyPasswordResetCode(email, code);

    return ResponseUtil.success(res, undefined, result.message);
  });

  /**
   * Send password reset email
   * @route POST /password/forgot
   */
  sendPasswordResetHandler = catchErrors(async (req, res) => {
    const email = emailSchema.parse(req.body.email);

    const { message, emailId } = await this.authService.sendPasswordResetEmail(email);

    return ResponseUtil.success(res, { emailId }, message);
  });

  /**
   * Reset password
   * @route POST /password/reset
   */
  resetPasswordHandler = catchErrors(async (req, res) => {
    const { email, password } = req.body;

    appAssert(email, ErrorFactory.requiredField("email"));
    appAssert(password, ErrorFactory.requiredField("Password"));

    const { user } = await this.authService.resetPassword({ email, password });

    return ResponseUtil.success(res, user, "Password was reset successfully");
  });

  /**
   * Change password (authenticated user)
   * @route POST /password/change
   */
  changePasswordHandler = catchErrors(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    appAssert(currentPassword, ErrorFactory.requiredField("Current password"));
    appAssert(newPassword, ErrorFactory.requiredField("New password"));
    appAssert(req.userId, ErrorFactory.requiredField("Authentication required"));

    const { user } = await this.authService.changePassword(
      req.userId.toString(),
      currentPassword,
      newPassword
    );

    return ResponseUtil.success(res, user, "Password changed successfully");
  });
}
