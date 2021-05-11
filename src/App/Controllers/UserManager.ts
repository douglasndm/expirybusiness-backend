import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import * as Yup from 'yup';

import UserRoles from '../Models/UserRoles';
import { Team } from '../Models/Team';
import { User } from '../Models/User';

class UserManagerController {
    async create(req: Request, res: Response): Promise<Response> {
        const schema = Yup.object().shape({
            id: Yup.string().required().uuid(),
            user_id: Yup.string().required().uuid(),
        });

        if (!(await schema.isValid(req.params))) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        try {
            const { id, user_id } = req.params;

            const userRolesRepository = getRepository(UserRoles);
            const alreadyInARole = await userRolesRepository.findOne({
                where: {
                    user: { id: user_id },
                    team: { id },
                },
            });

            if (alreadyInARole) {
                return res
                    .status(400)
                    .json({ error: 'User is already into team' });
            }

            const teamRepository = getRepository(Team);
            const userRepository = getRepository(User);

            const team = await teamRepository.findOne(id);
            const user = await userRepository.findOne(user_id);

            if (!team || !user) {
                return res
                    .status(400)
                    .json({ error: 'User or team was not found' });
            }

            const teamUser = new UserRoles();
            teamUser.user = user;
            teamUser.team = team;
            teamUser.role = 'Repositor';

            const savedRole = await userRolesRepository.save(teamUser);

            return res.json(savedRole);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async update(req: Request, res: Response): Promise<Response> {
        const schema = Yup.object().shape({
            id: Yup.string().required().uuid(),
            user_id: Yup.string().required().uuid(),
        });

        const schemaBody = Yup.object().shape({
            role: Yup.string(),
            name: Yup.string(),
            lastName: Yup.string(),
            email: Yup.string().email(),
        });

        if (
            !(await schema.isValid(req.params)) ||
            !(await schemaBody.isValid(req.body))
        ) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        try {
            const { id, user_id } = req.params;
            const { role, name, lastName, email } = req.body;

            const userRolesRepository = getRepository(UserRoles);

            const userRoles = await userRolesRepository.findOne({
                where: { user: { id: req.userId }, team: { id } },
            });

            if (userRoles?.role.toLocaleLowerCase() !== 'manager') {
                return res
                    .status(401)
                    .json({ error: 'You dont have authorization to do that' });
            }

            const userRole = await userRolesRepository.findOne({
                where: { user: { id: user_id }, team: { id } },
                relations: ['user'],
            });

            if (!userRole) {
                return res
                    .status(400)
                    .json({ error: 'User in team was not found' });
            }

            userRole.role = role;

            const updateRole = await userRolesRepository.save(userRole);

            /*
                In the future perhaps managers will be able to change users info
                like name, lastname and email
            */

            return res.json(updateRole);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    async delete(req: Request, res: Response): Promise<Response> {
        const schema = Yup.object().shape({
            id: Yup.string().required().uuid(),
            user_id: Yup.string().required().uuid(),
        });

        if (!(await schema.isValid(req.params))) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        try {
            const { id, user_id } = req.params;

            const userRolesRepository = getRepository(UserRoles);
            const role = await userRolesRepository.findOne({
                where: {
                    team: { id },
                    user: { id: user_id },
                },
            });

            if (!role) {
                return res
                    .status(400)
                    .json({ error: 'User or team was not found' });
            }

            await userRolesRepository.remove(role);

            return res.status(200).json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}

export default new UserManagerController();