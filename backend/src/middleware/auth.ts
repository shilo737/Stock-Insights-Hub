import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Role } from '../entities/User';

export interface AuthPayload {
  sub: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthPayload;
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

function parse(req: Request): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret) as jwt.JwtPayload;
    return { sub: String(decoded.sub), role: decoded.role as Role };
  } catch {
    return null;
  }
}

/** Attaches req.auth if a valid token is present; never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const p = parse(req);
  if (p) req.auth = p;
  next();
}

/** Token guard. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const p = parse(req);
  if (!p) return res.status(401).json({ error: 'נדרשת התחברות' });
  req.auth = p;
  next();
}

/** RBAC guard – must run after requireAuth. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'נדרשת הרשאת מנהל' });
  }
  next();
}
