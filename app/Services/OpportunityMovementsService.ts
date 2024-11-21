import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { DateTime } from "luxon";
import { AuthContext } from "./SharedService";

@inject()
export default class OpportunityMovementsService {
	public async searchOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunity?: number;
			movement?: string;
			type?: string;
		},
	): Promise<
		{
			opportunity_id: number;
			movement_id: string;
			type: "bill" | "budget";
		}[]
	> {
		const qb = Database.from("opportunities_movements")
			.select("opportunity_id", "movement_id", "type")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.whereNull("deleted_at");

		if (data.opportunity) {
			qb.where("opportunity_id", data.opportunity);
		}

		if (data.movement) {
			qb.where("movement_id", data.movement);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		return qb;
	}

	public async createOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunityId: number;
			movementId: string;
			type: string;
		}[],
	) {
		await Database.table("opportunities_movements")
			.returning("id")
			.multiInsert(
				data.map((elem) => ({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					creation_user_id: authCtx.user.id,
					opportunity_id: elem.opportunityId,
					movement_id: elem.movementId,
					type: elem.type,
				})),
			);
	}

	public async cancelOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunityId: number;
			movementId: string;
			type: string;
		}[],
	) {
		await Database.from("opportunities_movements")
			.whereNull("deleted_at")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.whereIn(
				"opportunity_id",
				data.map((d) => d.opportunityId),
			)
			.whereIn(
				"movement_id",
				data.map((d) => d.movementId),
			)
			.whereIn(
				"type",
				data.map((d) => d.type),
			)
			.update({
				user_deletion_id: authCtx.user.id,
				deleted_at: DateTime.now(),
			});
	}
}
