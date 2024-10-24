import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Meta from "App/Models/Meta";
import PerformanceRangeGoal from "App/Models/PerformanceRangeGoal";
import SharedService, { AuthContext } from "App/Services/SharedService";
import Decimal from "decimal.js";
import { DateTime } from "luxon";

@inject()
export default class PerformanceRangeGoalService {
	constructor(private _shared: SharedService) {}

	public async search(authCtx: AuthContext, metaId: string) {
		const meta = await Meta.query()
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("id", metaId)
			.first();

		if (!meta) {
			throw new BadRequestException("Meta não encontrada", 400, "E_ERR");
		}

		const goals = await meta
			.related("goals")
			.query()
			.where("economic_group_id", authCtx.group.id)
			.select("id", "startValue", "endValue", "color", "meta_id")
			.orderByRaw("start_value, end_value");

		return {
			metaId: meta.id,
			metaDescription: meta.description,
			ranges: goals.map((goal) => ({
				id: goal.id,
				startValue: goal.startValue.toNumber(),
				endValue: goal.endValue.toNumber(),
				color: goal.color,
			})),
		};
	}

	// public async store(
	// 	authCtx: AuthContext,
	// 	data: {
	// 		metaId: number;
	// 		ranges: {
	// 			startValue: number;
	// 			endValue: number;
	// 			color: string;
	// 		}[];
	// 	},
	// ) {
	// 	await Database.transaction(async (trx) => {
	// 		const meta = await Meta.query()
	// 			.useTransaction(trx)
	// 			.where("system_id", authCtx.system.id)
	// 			.where("economic_group_id", authCtx.group.id)
	// 			.where("id", data.metaId)
	// 			.first();
	// 		if (!meta) {
	// 			throw new BadRequestException("Meta não encontrada", 400, "E_ERR");
	// 		}
	//
	// 		await meta.related("goals").createMany(
	// 			data.ranges.map((elem) => ({
	// 				economic_group_id: authCtx.group.id,
	// 				create_user_id: authCtx.user.id,
	//
	// 				startValue: new Decimal(elem.startValue),
	// 				endValue: new Decimal(elem.endValue),
	// 				color: elem.color,
	// 			})),
	// 			{
	// 				client: trx,
	// 			},
	// 		);
	// 	});
	// }

	public async update(
		authCtx: AuthContext,
		data: {
			metaId: number;
			ranges: {
				startValue: number;
				endValue: number;
				color: string;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const meta = await Meta.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
					authCtx.group.id,
				])
				.where("id", data.metaId)
				.first();
			if (!meta) {
				throw new BadRequestException("Meta não encontrada", 400, "E_ERR");
			}

			// if (!meta.economic_group_id) {
			// 	throw new BadRequestException(
			// 		"Meta geral do sistema não pode ser alterada",
			// 		400,
			// 		"E_ERR",
			// 	);
			// }

			await PerformanceRangeGoal.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("meta_id", data.metaId)
				.update({
					delete_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				});

			await meta.related("goals").createMany(
				data.ranges.map((elem) => ({
					economic_group_id: authCtx.group.id,
					create_user_id: authCtx.user.id,

					startValue: new Decimal(elem.startValue),
					endValue: new Decimal(elem.endValue),
					color: elem.color,
				})),
				{
					client: trx,
				},
			);
		});
	}

	public async delete(
		authCtx: AuthContext,
		data: {
			metaId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const meta = await Meta.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.where("economic_group_id", authCtx.group.id)
				.where("id", data.metaId)
				.first();
			if (!meta) {
				throw new BadRequestException("Meta não encontrada", 400, "E_ERR");
			}

			await PerformanceRangeGoal.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("meta_id", data.metaId)
				.update({
					delete_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				});
		});
	}
}
