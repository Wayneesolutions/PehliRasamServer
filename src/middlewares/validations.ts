/**
    @description: validations middleware
    @author: [sant]
*/

import { Request, Response, NextFunction } from 'express';
import z, { ZodError } from 'zod';
import { responseCodes } from '../configs/responseCodes';
import { errorRes } from '../configs/responseConfig';

const mapError = (error: ZodError) => {
    if (error instanceof ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessages = error.errors.map((issue: any) => ({
            field: `${issue.path.join('.')}`,
            message: `${issue.message}`
        }));
        return errorMessages;
    }
    return error;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateBody = (schema: z.ZodObject<any, any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = mapError(error);
                res.status(200).json(
                    errorRes({
                        statusCode: responseCodes.badRequest,
                        message: 'Invalid data',
                        data: errorMessages
                    })
                );
            } else {
                res.status(200).json(
                    errorRes({
                        statusCode: responseCodes.serverError
                    })
                );
            }
        }
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateParams = (schema: z.ZodObject<any, any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = mapError(error);
                res.status(200).json(
                    errorRes({
                        statusCode: responseCodes.badRequest,
                        message: 'Invalid Params',
                        data: errorMessages
                    })
                );
            } else {
                res.status(200).json(
                    errorRes({
                        statusCode: responseCodes.serverError
                    })
                );
            }
        }
    };
};
