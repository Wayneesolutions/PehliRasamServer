import { Request, Response } from 'express';

import * as Customer from '../models/useCases/customer';
import { successRes } from '../configs/responseConfig';
import { responseCodes } from '../configs/responseCodes';

export const createCustomer = async (req: Request, res: Response): Promise<any> => {
    try {
        const customerExists = await Customer.findOne(req.body.email);

        if (customerExists)
            return res.status(400).json(
                successRes({
                    statusCode: responseCodes.badRequest,
                    message: 'Customer already exists',
                    data: customerExists,
                })
            );

        const customer = await Customer.create(req.body);
        return res.status(201).json(
            successRes({
                statusCode: responseCodes.success,
                message: 'Customer created successfully',
                data: customer,
            })
        );
    } catch (error) {
        return res.status(500).json(
            successRes({
                statusCode: responseCodes.serverError,
                message: 'Employee fetched failed',
                data: error,
            })
        );
    }
};

export const getCustomers = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const skip = (page - 1) * limit;

        const employees = await Customer.findAll({ skip, limit });
        const total = await Customer.countDocuments();

        return res.status(200).json(
            successRes({
                statusCode: responseCodes.success,
                message: 'Employees fetched successfully',
                data: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    data: employees,
                },
            })
        );
    } catch (error) {
        return res.status(500).json(
            successRes({
                statusCode: responseCodes.serverError,
                message: 'Employee fetched failed',
                data: error,
            })
        );
    }
};

export const getCustomerById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const employees = await Customer.findById(id);
        if (!employees) {
            return res.status(404).json(
                successRes({
                    statusCode: responseCodes.notFound,
                    message: 'Employee not found',
                    data: null,
                })
            );
        }

        return res.status(200).json(
            successRes({
                statusCode: responseCodes.success,
                message: 'Employees fetched successfully',
                data: employees,
            })
        );
    } catch (error) {
        return res.status(500).json(
            successRes({
                statusCode: responseCodes.serverError,
                message: 'Employee fetched failed',
                data: error,
            })
        );
    }
};

export const updateCustomer = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(400).json(
                successRes({
                    statusCode: responseCodes.badRequest,
                    message: 'Customer not found',
                    data: null,
                })
            );
        }

        const customerData = await Customer.updateOne(id, { ...req.body });

        return res.status(200).json(
            successRes({
                statusCode: responseCodes.success,
                message: 'Customer updated successfully',
                data: customerData,
            })
        );
    } catch (error) {
        return res.status(500).json(
            successRes({
                statusCode: responseCodes.serverError,
                message: 'Customer updated failed',
                data: error,
            })
        );
    }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(400).json(
                successRes({
                    statusCode: responseCodes.badRequest,
                    message: 'Customer not found',
                    data: null,
                })
            );
        }

        const customerData = await Customer.deleteOne(id);

        return res.status(200).json(
            successRes({
                statusCode: responseCodes.success,
                message: 'Customer deleted successfully',
                data: customerData,
            })
        );
    } catch (error) {
        return res.status(500).json(
            successRes({
                statusCode: responseCodes.serverError,
                message: 'Customer deleted failed',
                data: error,
            })
        );
    }
};
