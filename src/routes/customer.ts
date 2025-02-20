import { Router } from 'express';

import * as customerController from '../controllers/customer';
// import { authenticateJWT } from '../middlewares/jwtAuth';
import { customerSchema } from '../schema/customer';
import { validateBody } from '../middlewares/validations';

const router = Router();

router.route('/upload-image').post( customerController.uploadImage);

router.route('/').get(
    customerController.getCustomers
);

router.route('/:id').get(
    customerController.getCustomerById
);

router.route('/').post(
    validateBody(customerSchema),
    customerController.createCustomer
);

router.route('/:id').put(

    validateBody(customerSchema),
    customerController.updateCustomer
);

router.route('/:id').delete(
    customerController.deleteCustomer
);

export default router;
