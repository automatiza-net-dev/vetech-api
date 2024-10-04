import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import DreGroup from "App/Models/DreGroup";
import SharedService, { AuthContext } from "App/Services/SharedService";
import Logger from "@ioc:Adonis/Core/Logger";
import { DateTime } from "luxon";
import Database from "@ioc:Adonis/Lucid/Database";
import Decimal from "decimal.js";
import DreCostPlanning from "App/Models/DreCostPlanning";
import DreCostPlanningItem from "App/Models/DreCostPlanningItem";

type SqlResult = {
	b_id: string;
	identification: string;
	periodo: string;
	dg_id: string;
	agrupamento_dre: string;
	sequence: string;
	id_grupo_plano_contas: string;
	grupo_plano_contas: string;
	id_plano_contas_pai: string;
	plano_contas_pai: string;
	id_plano_contas: string;
	plano_contas: string;
	custo: string;
};

@inject()
export default class DreGroupService {
	public async index(authCtx: AuthContext, data: { period?: string }) {
		if (!data.period) {
			throw new BadRequestException("Periodo não informado", 400, "E_REQ");
		}

		const result: SqlResult[] = await Database.from("account_plans")
			.select(
				Database.raw(
					`business_units.id                                          as b_id,
       business_units.identification,

       coalesce(dcp."period", ?)               as periodo,

       dre_groups.id                                              as dg_id,
       coalesce(dre_groups.description, 'Nao Informado')          as agrupamento_dre,
       dre_groups.sequence,

       account_plan_groups.id                                     as id_grupo_plano_contas,
       coalesce(account_plan_groups.description, 'Nao Informado') as grupo_plano_contas,

       apPai.id                                                   as id_plano_contas_pai,
       apPai.description                                          as plano_contas_pai,

       account_plans.id                                           as id_plano_contas,
       account_plans.description                                  as plano_contas,
       coalesce(dcpi."cost", 0)                                   as custo`,
					[data.period],
				),
			)
			.joinRaw(
				"join business_units on account_plans.business_unit_id = business_units.id",
			)
			.joinRaw(
				`left join account_plan_groups
                   on account_plan_groups.id = account_plans.account_plan_group_id and account_plan_groups.system_id = ?`,
				[authCtx.system.id],
			)
			.joinRaw(
				"left join dre_groups on account_plan_groups.dre_group_id = dre_groups.id and dre_groups.system_id = ?",
				[authCtx.system.id],
			)
			.joinRaw(
				"left join account_plans apPai on account_plans.parent_id = apPai.id",
				[],
			)
			.joinRaw(
				`left join dre_cost_plannings dcp
                   on dcp.business_unit_id = ? and period = ?`,
				[authCtx.unit.id, data.period],
			)
			.joinRaw(
				`left join dre_cost_planning_items dcpi
                   on dcp.id = dcpi.dre_cost_planning_id and dcpi.account_plan_id = account_plans.id`,
				[],
			)
			.where("account_plans.system_id", authCtx.system.id)
			.whereRaw(
				"(account_plans.economic_group_id is null or account_plans.economic_group_id = ?)",
				[authCtx.group.id],
			)
			.whereRaw(
				"(account_plan_groups.economic_group_id is null or account_plan_groups.economic_group_id = ?)",
				[authCtx.group.id],
			)
			.whereRaw(
				"(account_plans.business_unit_id is null or account_plans.business_unit_id = ?)",
				[authCtx.group.id],
			)
			.orderByRaw(
				`coalesce(dre_groups."sequence", 100), account_plan_groups.description, apPai.description, account_plans.description`,
			);

		const groups = SharedService.GroupBy(result, (row) => [
			JSON.stringify({
				b_id: row.b_id,
				periodo: row.periodo,
			}),
		]);

		return Object.keys(groups).reduce((currArray, groupKey) => {
			const { b_id, periodo } = JSON.parse(groupKey);

			const uniqueDreGroups = groups[groupKey].reduce((currGroups, currRow) => {
				if (!currGroups.includes(currRow.dg_id)) {
					currGroups.push(currRow.dg_id);
				}

				return currGroups;
			}, [] as string[]);

			currArray.push({
				id: b_id,
				identification:
					result.find((r) => r.b_id === b_id)?.identification ??
					"Não encontrado",
				periodo,
				agrupamentos: uniqueDreGroups.map((group) => ({
					id: group,
					identification:
						result.find((r) => r.dg_id === group)?.agrupamento_dre ??
						"Não encontrado",
					sequencia: result.find((r) => r.dg_id === group)?.sequence ?? 0,
					grupo_plano_contas: result
						.filter(
							(gpContas) =>
								gpContas.b_id === b_id &&
								gpContas.periodo === periodo &&
								gpContas.dg_id === group,
						)
						.reduce((currArray, gpContas) => {
							if (
								!currArray.find((c) => c.id === gpContas.id_grupo_plano_contas)
							) {
								currArray.push({
									id: gpContas.id_grupo_plano_contas,
									description: gpContas.grupo_plano_contas,
									grupo_planos_contas_pai: result
										.filter(
											(gpContasPai) =>
												gpContasPai.b_id === b_id &&
												gpContasPai.periodo === periodo &&
												gpContasPai.dg_id === group,
										)
										.reduce((currArray, gpContasPai) => {
											if (
												!currArray.find(
													(c) => c.id === gpContasPai.id_plano_contas_pai,
												)
											) {
												currArray.push({
													id: gpContasPai.id_plano_contas_pai,
													description: gpContasPai.plano_contas_pai,
													grupo_planos_contas: result
														.filter(
															(gpContasFilho) =>
																gpContasPai.id_plano_contas_pai ===
																gpContasFilho.id_plano_contas,
														)
														.reduce((currArray, gpContasFilho) => {
															if (
																!currArray.find(
																	(c) => c.id === gpContasFilho.id_plano_contas,
																)
															) {
																currArray.push({
																	id: gpContasFilho.id_plano_contas,
																	description: gpContasFilho.plano_contas,
																	custo: gpContasFilho.custo,
																});
															}

															return currArray;
														}, [] as any[]),
												});
											}

											return currArray;
										}, [] as any[]),
								});
							}

							return currArray;
						}, [] as any[]),
				})),
			});

			return currArray;
		}, [] as any[]);
	}

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
					active: data.active,
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
