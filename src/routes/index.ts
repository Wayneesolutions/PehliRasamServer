import { Router } from 'express';
import customer from './customer';

const router = Router();

router.use('/customer', customer);

export default router;
