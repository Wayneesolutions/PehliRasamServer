import z from 'zod';

export const customerSchema = z.object({
    name: z.string().min(3).max(50),
    email: z.string().email().min(3).max(50),
    company: z.string().min(3).max(50),
    contact: z.string().min(3).max(50),
    title: z.string().min(3).max(50),
    status: z.enum([
        'NEW',
        'CONTACTED',
        'INTERESTED',
        'QUALIFIED',
        'UNQUALIFIED',
        'REJECTED',
        'WON',
        'LOST',
        'NEGOTIATED',
    ]),
});
