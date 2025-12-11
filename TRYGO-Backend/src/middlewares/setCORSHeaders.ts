import { Request, Response, NextFunction } from 'express';

export const setCORSHeaders = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
};
