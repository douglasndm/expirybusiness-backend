import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import * as Yup from 'yup';

import { Category } from '../Models/Category';
import { Product } from '../Models/Product';
import ProductCategory from '../Models/ProductCategory';

class ProductCategoryController {
    async create(req: Request, res: Response): Promise<Response> {
        const schema = Yup.object().shape({
            id: Yup.string().required().uuid(),
        });
        const schemaBody = Yup.object().shape({
            product_id: Yup.string().required().uuid(),
        });

        if (
            !(await schema.isValid(req.params)) ||
            !(await schemaBody.isValid(req.body))
        ) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        try {
            const { id } = req.params;
            const { product_id } = req.body;

            const repository = getRepository(ProductCategory);

            const alreadyExists = await repository.findOne({
                where: {
                    category: {
                        id,
                    },
                    product: {
                        id: product_id,
                    },
                },
            });

            if (alreadyExists) {
                return res
                    .status(400)
                    .json({ error: 'Product is already in category' });
            }

            const productRepository = getRepository(Product);
            const categoryRepository = getRepository(Category);

            const product = await productRepository.findOne({
                where: { id: product_id },
            });
            const category = await categoryRepository.findOne({
                where: { id },
            });

            if (!product || !category) {
                return res
                    .status(400)
                    .json({ error: 'Category or Product was not found' });
            }

            const productCategory = new ProductCategory();
            productCategory.category = category;
            productCategory.product = product;

            const savedProductCategory = await repository.save(productCategory);

            return res.status(200).json(savedProductCategory);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async delete(req: Request, res: Response): Promise<Response> {
        const schema = Yup.object().shape({
            id: Yup.string().required().uuid(),
        });
        const schemaBody = Yup.object().shape({
            product_id: Yup.string().required().uuid(),
        });

        if (
            !(await schema.isValid(req.params)) ||
            !(await schemaBody.isValid(req.body))
        ) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        try {
            const { id } = req.params;
            const { product_id } = req.body;

            const repository = getRepository(ProductCategory);

            const exists = await repository.findOne({
                where: {
                    category: {
                        id,
                    },
                    product: {
                        id: product_id,
                    },
                },
            });

            if (!exists) {
                return res
                    .status(400)
                    .json({ error: 'Product was not in category' });
            }

            const savedProductCategory = await repository.remove(exists);

            return res
                .status(200)
                .json({ success: 'Product was removed from category' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}

export default new ProductCategoryController();