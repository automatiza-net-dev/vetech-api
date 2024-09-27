import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import DreGroup from "App/Models/DreGroup";
import { AuthContext } from "App/Services/SharedService";
import Logger from "@ioc:Adonis/Core/Logger";
import { DateTime } from "luxon";
import Database from "@ioc:Adonis/Lucid/Database";
import Decimal from "decimal.js";
import DreCostPlanning from "App/Models/DreCostPlanning";
import DreCostPlanningItem from "App/Models/DreCostPlanningItem";

@inject()
export default class DreGroupService {
	public async search(
		authCtx: AuthContext,
		data: {
			dreGroup?: string;
			description?: string;
			active?: string;
		},
	) {
		const qb = DreGroup.query()
			.preload("createUser", (query) => query.select("id", "name"))
			.preload("updateUser", (query) => query.select("id", "name"))
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? OR economic_group_id IS NULL)", [
				authCtx.group.id,
			]);

		if (data.dreGroup) {
			qb.where("id", data.dreGroup);
		}

		if (data.description) {
			qb.whereILike("description", `%${data.description}%`);
		}

		if (data.active) {
			qb.where("active", data.active === "true");
		}

		return qb;
	}

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

	public async storePlanning(
		authCtx: AuthContext,
		data: {
			period: string;
			accountPlans: {
				accountPlanId: string;
				cost: number;
			}[];
		},
	) {
		try {
			await Database.transaction(async (trx) => {
				const planning = await DreCostPlanning.create(
					{
						business_unit_id: authCtx.unit.id,
            create_user_id: authCtx.user.id,
						period: data.period,
					},
					{ client: trx },
				);

				await DreCostPlanningItem.createMany(
					data.accountPlans.map((item) => ({
						dre_cost_planning_id: planning.id,
						account_plan_id: item.accountPlanId,
						create_user_id: authCtx.user.id,

						cost: new Decimal(item.cost),
					})),
					{
						client: trx,
					},
				);
			});
		} catch (e: unknown) {
			const contraint: string | null =
				// @ts-ignore
				("constraint" in e && e.constraint) ?? null;

			if (
				contraint?.includes("dre_cost_plannings_business_unit_id_period_unique")
			) {
				throw new InternalErrorException("Período já existe", 400, "E_ERR");
			}

			if (contraint?.includes("dre_cost_planning_items_pkey")) {
				throw new InternalErrorException(
					"Configuração de Plano/Plano de conta já existe",
					400,
					"E_ERR",
				);
			}

			Logger.error(e);
			throw new InternalErrorException("Erro criando custos", 500, "E_ERR");
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

			throw new InternalErrorException(
				"Erro atualizando Grupo DRE",
				500,
				"E_ERR",
			);
		}
	}

	public async updatePlanning(
		authCtx: AuthContext,
		data: {
			dreGroupPlanningId: number;
			accountPlans: {
				accountPlanId: string;
				cost: number;
			}[];
		},
	) {
		try {
			await Database.transaction(async (trx) => {
				const planning = await DreCostPlanning.query()
					.useTransaction(trx)
					.where("id", data.dreGroupPlanningId)
					.where("business_unit_id", authCtx.unit.id)
					.first();

				if (!planning) {
					throw new BadRequestException(
						"Planejamento não encontrado",
						400,
						"E_ERR",
					);
				}

				await planning
					.merge({
						update_user_id: authCtx.user.id,
					})
					.useTransaction(trx)
					.save();

				await planning.related("items").query().useTransaction(trx).delete();

				await DreCostPlanningItem.createMany(
					data.accountPlans.map((item) => ({
						dre_cost_planning_id: planning.id,
						account_plan_id: item.accountPlanId,
						create_user_id: authCtx.user.id,

						cost: new Decimal(item.cost),
					})),
					{
						client: trx,
					},
				);
			});
		} catch (e: unknown) {
			const contraint: string | null =
				// @ts-ignore
				("constraint" in e && e.constraint) ?? null;

			if (contraint?.includes("dre_cost_planning_items_pkey")) {
				throw new InternalErrorException(
					"Configuração de Plano/Plano de conta já existe",
					400,
					"E_ERR",
				);
			}

			Logger.error(e);
			throw new InternalErrorException("Erro criando custos", 500, "E_ERR");
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

	public async deletePlanning(
		authCtx: AuthContext,
		data: {
			id: number;
		},
	) {
		const planning = await DreCostPlanning.query()
			.where("id", data.id)
			.where("business_unit_id", authCtx.unit.id)
			.first();

		if (!planning) {
			throw new BadRequestException("Grupo não encontrado", 400, "E_ERR");
		}

		await planning
			.merge({
				delete_user_id: authCtx.user.id,
				deletedAt: DateTime.now(),
			})
			.save();
	}
}
