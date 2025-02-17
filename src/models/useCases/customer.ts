import mongoose from 'mongoose';
import { ICustomer } from '../../types/customer';
import CUSTOMER from '../entities/customer';

export const create = async (data: ICustomer) => {
    const newCustomer = new CUSTOMER(data);
    return await newCustomer.save();
};

export const findAll = async ({ skip = 0, limit = 10 }: { skip?: number; limit?: number }) => {
    return await CUSTOMER.find().skip(skip).limit(limit).exec();
};

export const countDocuments = async () => {
    return await CUSTOMER.countDocuments();
};

export const findOne = async (email: string) => {
    return await CUSTOMER.findOne({ email });
};

export const findById = async (id: string) => {
    return await CUSTOMER.findOne({ _id: id });
};

export const updateOne = async (id: mongoose.Types.ObjectId | string, data: Partial<ICustomer>) => {
    try {
        return await CUSTOMER.updateOne({ _id: id }, data);
    } catch (error) {
        throw error;
    }
};

export const deleteOne = async (id: mongoose.Types.ObjectId | string) => {
    try {
        return await CUSTOMER.deleteOne({ _id: id });
    } catch (error) {
        throw error;
    }
};
