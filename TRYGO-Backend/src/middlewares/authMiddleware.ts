import { Request, Response, NextFunction } from 'express';
import authService from '../services/AuthService';

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization
        ? req.headers.authorization.split(' ')[1]
        : '';

    if (!token) {
        return res.status(401).json({ error: 'No token provided.' });
    }

    let currentUser = null;

    if (token) {
        currentUser = authService.getDataFromToken(token);
    }

    next();

    return { token, currentUser };
};
