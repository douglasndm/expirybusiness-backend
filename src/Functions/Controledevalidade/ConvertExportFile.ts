import { getRepository } from 'typeorm';
import { startOfDay, parseISO } from 'date-fns';

import { Product } from '../../App/Models/Product';
import { Batch } from '../../App/Models/Batch';
import { Team } from '../../App/Models/Team';
import ProductTeams from '../../App/Models/ProductTeams';

interface convertExportFileProps {
    oldProducts: Array<CVProduct>;
    team_id: string;
}

export async function convertExportFile({
    oldProducts,
    team_id,
}: convertExportFileProps): Promise<Array<Product>> {
    const teamRepository = getRepository(Team);
    const productRepository = getRepository(Product);
    const batchRepository = getRepository(Batch);
    const prodTeamRepository = getRepository(ProductTeams);

    const team = await teamRepository.findOne(team_id);

    if (!team) {
        throw new Error('Team was not found');
    }

    const products: Array<Product> = [];
    const prodTeam: Array<ProductTeams> = [];
    const batc: Array<Batch> = [];

    oldProducts.forEach(prod => {
        const product = productRepository.create();
        product.name = prod.name;
        product.code = prod.code || '';

        const batches: Array<Batch> = [];

        prod.lotes.forEach(bat => {
            const batch = batchRepository.create();
            batch.name = bat.lote;
            batch.exp_date = startOfDay(parseISO(bat.exp_date));
            batch.amount = bat.amount;
            batch.price = bat.price;
            batch.status = bat.status === 'Tratado' ? 'checked' : 'unchecked';
            batch.product = product;

            batches.push(batch);
            batc.push(batch);
        });

        const productInTeam = prodTeamRepository.create();
        productInTeam.product = product;
        productInTeam.team = team;

        products.push(product);
        prodTeam.push(productInTeam);
    });

    const savedProducts = await productRepository.save(products);
    await prodTeamRepository.save(prodTeam);
    await batchRepository.save(batc);

    return savedProducts;
}