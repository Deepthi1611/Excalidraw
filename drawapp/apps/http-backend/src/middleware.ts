import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getJwtSecret } from "@repo/backend-common/config";

export function middleware(req: Request, res: Response, next: NextFunction) {
  try {
  const token = req.headers['authorization'] || "";

  const jwtSecret = getJwtSecret();
  if (!jwtSecret) throw new Error("JWT_SECRET is not defined");
  const decoded = jwt.verify(token, jwtSecret);
  if(decoded){
    // TO DO: Add type for req.userId
    req.userId = (decoded as JwtPayload).userId;
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
} catch (err) {
  console.error('Error in middleware:', err);
  res.status(401).send('Unauthorized');
}
}