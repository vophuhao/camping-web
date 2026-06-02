import { JWT_REFRESH_SECRET, JWT_SECRET, ROLES } from "../constants";
import type { SessionDocument, UserDocument } from "@/models";
import type { SignOptions, VerifyOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

// ===== Types =====
export type RefreshTokenPayload = {
  sessionId: SessionDocument["_id"];
};

export type AccessTokenPayload = {
  userId: UserDocument["_id"];
  sessionId: SessionDocument["_id"];
};

type SignOptionsWithSecret = SignOptions & {
  secret: string;
};

type VerifyOptionsWithSecret = VerifyOptions & {
  secret?: string;
};

type VerifyResult<TPayload> =
  | { payload: TPayload; error?: never }
  | { error: string; payload?: never };

// ===== Constants =====
const DEFAULT_SIGN_OPTIONS: SignOptions = {
  audience: [ROLES.USER],
};

const DEFAULT_VERIFY_OPTIONS: VerifyOptions = {
  audience: [ROLES.USER],
};

const ACCESS_TOKEN_OPTIONS: SignOptionsWithSecret = {
  expiresIn: "1d",
  secret: JWT_SECRET,
};

export const REFRESH_TOKEN_OPTIONS: SignOptionsWithSecret = {
  expiresIn: "7d",
  secret: JWT_REFRESH_SECRET,
};

// ===== Functions =====
export const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  options: SignOptionsWithSecret = ACCESS_TOKEN_OPTIONS
) => {
  const { secret, ...signOpts } = options;

  return jwt.sign(payload, secret, {
    ...DEFAULT_SIGN_OPTIONS,
    ...signOpts, // User provided options override defaults
  });
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options: VerifyOptionsWithSecret = {}
): VerifyResult<TPayload> => {
  const { secret = JWT_SECRET, ...verifyOpts } = options;

  try {
    const payload = jwt.verify(token, secret, {
      ...DEFAULT_VERIFY_OPTIONS,
      ...verifyOpts, // User provided options override defaults
      audience: verifyOpts.audience as  // just to satisfy typescript
        | string
        | RegExp
        | [string | RegExp, ...(string | RegExp)[]]
        | undefined,
    }) as unknown as TPayload;
    return {
      payload,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};
