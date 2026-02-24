import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';

const JWT_SECRET: string = process.env.JWT_SECRET || '3a6b5d2b9f8f536613f3d451d7f771c0ffdb620851e2b23db25c22a0a16445ad';

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;