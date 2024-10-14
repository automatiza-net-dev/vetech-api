import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import MarketingCampaign from "App/Models/MarketingCampaign";
import { AuthContext } from "App/Services/SharedService";
import Decimal from "decimal.js";
import { DateTime } from "luxon";

@inject()
export default class MarketingCampaignService {
	public async index(
		authCtx: AuthContext,
		data: {
			clientOriginId?: string;
			active?: string;
		},
	) {
		const qb = MarketingCampaign.query()
			.select("id", "description")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("active", true)
			.whereRaw(
				"(now()::date between marketing_campaigns.start_date and marketing_campaigns.end_date)",
			);

		if (data.clientOriginId) {
			qb.whereHas("clientOrigins", (query) => {
				query.where("client_origin_id", data.clientOriginId ?? "");
			});
		}

		if (data.active) {
			qb.where("active", data.active === "true");
		}

		return await qb;
	}

	public async search(
		authCtx: AuthContext,
		data: {
			id?: string;
			description?: string;
			active?: string;
		},
	) {
		const qb = MarketingCampaign.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.preload("clientOrigins")
			.preload("createUser", (query) => {
				query.select("id", "name");
			})
			.preload("updateUser", (query) => {
				query.select("id", "name");
			});

		if (data.id) {
			qb.where("id", data.id);
		}

		if (data.description) {
			qb.whereRaw("description ilike ?", [`%${data.description}%`]);
		}

		if (data.active) {
			qb.where("active", data.active === "true");
		}

		return await qb;
	}

	public async store(
		authCtx: AuthContext,
		data: {
			clientOriginIdList: string[];

			description: string;
			startDate: DateTime;
			endDate: DateTime;
			investmentValue: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const campaign = await MarketingCampaign.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					create_user_id: authCtx.user.id,

					description: data.description,
					startDate: data.startDate.toFormat("yyyy-MM-dd"),
					endDate: data.endDate.toFormat("yyyy-MM-dd"),
					investmentValue: new Decimal(data.investmentValue),
				},
				{ client: trx },
			);

			await campaign.related("clientOrigins").createMany(
				data.clientOriginIdList.map((elem) => ({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					client_origin_id: elem,
				})),
				trx,
			);
		});
	}

	public async update(
		authCtx: AuthContext,
		data: {
			id: number;
			clientOriginIdList: string[];

			description: string;
			startDate: DateTime;
			endDate: DateTime;
			investmentValue: number;
			active: boolean;
		},
	) {
		const model = await MarketingCampaign.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("id", data.id)
			.first();

		if (!model) {
			throw new ResourceNotFoundException(
				"Campanha não encontrada",
				404,
				"E_ERR",
			);
		}

		await Database.transaction(async (trx) => {
			await model
				.merge({
					update_user_id: authCtx.user.id,

					description: data.description,
					startDate: data.startDate.toFormat("yyyy-MM-dd"),
					endDate: data.endDate.toFormat("yyyy-MM-dd"),
					investmentValue: new Decimal(data.investmentValue),
					active: data.active,
				})
				.useTransaction(trx)
				.save();

			const existingClients = await model
				.related("clientOrigins")
				.query()
				.useTransaction(trx);

			const toRemove = existingClients.filter(
				(f) => !data.clientOriginIdList.includes(f.client_origin_id),
			);
			await model
				.related("clientOrigins")
				.query()
				.whereIn(
					"id",
					toRemove.map((f) => f.id),
				)
				.delete();

			const toCreate = data.clientOriginIdList.filter(
				(f) => !existingClients.find((ec) => ec.client_origin_id === f),
			);
			await model.related("clientOrigins").createMany(
				toCreate.map((elem) => ({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					client_origin_id: elem,
				})),
				trx,
			);
		});
	}

	public async delete(authCtx: AuthContext, id: number) {
		const model = await MarketingCampaign.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("id", id)
			.first();

		if (!model) {
			throw new ResourceNotFoundException(
				"Campanha não encontrada",
				404,
				"E_ERR",
			);
		}

		const usingOpportunities = await model.related("opportunities").query();
		if (usingOpportunities.length > 0) {
			throw new BadRequestException(
				"Campanha de Mkt está vinculado a oportunidades. Impossivel excluir. Passe a campanha para Ativo = Não",
				400,
				"E_ERR",
			);
		}

		await model
			.merge({
				delete_user_id: authCtx.user.id,
				deletedAt: DateTime.now(),
			})
			.save();
	}
}
