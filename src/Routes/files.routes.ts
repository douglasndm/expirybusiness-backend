import { Router } from 'express';
import multer from 'multer';

import Import from '@controllers/ImportController';
import ImageUpload from '@controllers/Product/Images/Upload';

import { storage } from '../Config/Multer';

import ManagerCheckerMiddleware from '../App/Middlewares/ManagerChecker';

const filesRoute = Router({ mergeParams: true });

const upload = multer({ storage });

filesRoute.post(
    '/team/:team_id/products/import',
    ManagerCheckerMiddleware,
    upload.single('file'),
    Import.store,
);

filesRoute.post(
    '/product/:product_id/image',
    upload.single('file'),
    ImageUpload.store,
);

export default filesRoute;
