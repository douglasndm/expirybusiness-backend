import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import * as Yup from 'yup';

import { checkIfUserHasAccessToTeam } from '../../Functions/Security/UserAccessTeam';

import TeamSubscription from '../Models/TeamSubscription';

class TeamSubscriptionsController {
    async index(req: Request, res: Response): Promise<Response> {
        const schema = Yup.object().shape({
            team_id: Yup.string().required().uuid(),
        });

        if (!(await schema.isValid(req.params))) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        try {
            const { team_id } = req.params;

            const userHasAccess = await checkIfUserHasAccessToTeam({
                user_id: req.userId,
                team_id,
            });

            if (!userHasAccess) {
                return res
                    .status(401)
                    .json({ error: 'You dont have access to do that' });
            }

            const repository = getRepository(TeamSubscription);

            const response = await repository
                .createQueryBuilder('subs')
                .leftJoinAndSelect('subs.team', 'team')
                .where('team.id = :team_id', { team_id })
                .getMany();

            return res.json(response);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}

export default new TeamSubscriptionsController();
