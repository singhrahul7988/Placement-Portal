import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  id: string;
  iat: number;
  exp: number;
};

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized, token missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;
    (req as Request & { userId?: string }).userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

export default authMiddleware;
