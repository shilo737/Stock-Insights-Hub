import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'שגיאת ולידציה',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  console.error(err);
  res.status(500).json({ error: 'שגיאת שרת פנימית' });
}
