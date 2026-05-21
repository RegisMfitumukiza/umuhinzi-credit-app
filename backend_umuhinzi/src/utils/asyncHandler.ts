import {Request, Response, NextFunction} from 'express';

type asyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<unknown>
 
export const asyncHandler = (fn : asyncController) => (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

