import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "zjy-substation-secret-key-2026";
const TOKEN_EXPIRY = "7d";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  tokenId: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/** 从 Cookie 中提取并验证 token */
export function getUserFromCookies(cookieHeader: string | null): JwtPayload | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/token=([^;]+)/);
  if (!match) return null;
  return verifyToken(match[1]);
}
