import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from "@repo/backend-common/config";

export function middleware(req: Request, res: Response, next: NextFunction) {
  try {
  const token = req.headers['authorization'] || "";

  if(!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const decoded = jwt.verify(token, JWT_SECRET);

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