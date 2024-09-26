import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import DreGroup from "App/Models/DreGroup";
import { AuthContext } from "App/Services/SharedService";
import Logger from "@ioc:Adonis/Core/Logger";
import { DateTime } from "luxon";

@inject()
export default class DreGroupService {
	public async store(
		authCtx: AuthContext,
		data: {
			description: string;
			sequence: number;
		},
	) {
		try {
			await DreGroup.create({
				system_id: authCtx.system.id,
				economic_group_id: authCtx.group.id,
				create_user_id: authCtx.user.id,

				description: data.description,
				sequence: data.sequence,
				active: true,
			});
		} catch (e: unknown) {
			if (
				// @ts-ignore
				"constraint" in e &&
				// @ts-ignore
				e.constraint.includes(
					"dre_groups_economic_group_id_system_id_sequence_unique",
				)
			) {
				throw new InternalErrorException("Sequencia já existe", 400, "E_ERR");
			}

			Logger.error(JSON.stringify(e));
			throw new InternalErrorException("Erro criando Grupo DRE", 500, "E_ERR");
		}
	}

	public async update(
		authCtx: AuthContext,
		data: {
			id: number;
			description: string;
			sequence: number;
			active: boolean;
		},
	) {
		const group = await DreGroup.query()
			.where("id", data.id)
			.where("economic_group_id", authCtx.group.id)
			.where("system_id", authCtx.system.id)
			.first();

		if (!group) {
			throw new BadRequestException("Grupo não encontrado", 400, "E_ERR");
		}

		try {
			await group
				.merge({
					update_user_id: authCtx.user.id,

					description: data.description,
					sequence: data.sequence,
					active: true,
				})
				.save();
		} catch (e: unknown) {
			if (
				// @ts-ignore
				"constraint" in e &&
				// @ts-ignore
				e.constraint.includes(
					"dre_groups_economic_group_id_system_id_sequence_unique",
				)
			) {
				throw new InternalErrorException("Sequencia já existe", 400, "E_ERR");
			}

			throw new InternalErrorException("Erro atualizando Grupo DRE", 500, "E_ERR");
		}
	}

	public async delete(
		authCtx: AuthContext,
		data: {
			id: number;
		},
	) {
		const group = await DreGroup.query()
			.where("id", data.id)
			.where("economic_group_id", authCtx.group.id)
			.where("system_id", authCtx.system.id)
			.first();

		if (!group) {
			throw new BadRequestException("Grupo não encontrado", 400, "E_ERR");
		}

		await group
			.merge({
				delete_user_id: authCtx.user.id,
				deletedAt: DateTime.now(),
			})
			.save();
	}
}
