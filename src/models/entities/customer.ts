import mongoose, { Schema } from 'mongoose';

const customerSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        contact: {
            type: String,
            required: true,
        },
        company: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: [
                'NEW',
                'CONTACTED',
                'INTERESTED',
                'QUALIFIED',
                'UNQUALIFIED',
                'REJECTED',
                'WON',
                'LOST',
                'NEGOTIATED',
            ],
            default: 'NEW',
        },
    },
    {
        timestamps: true,
    }
);

const Customer = mongoose.model('Customers', customerSchema);
export default Customer;
