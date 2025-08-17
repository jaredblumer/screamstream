import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten();
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    // put parsed data back so handlers can trust it
    req.body = result.data as unknown as T;
    next();
  };
}
