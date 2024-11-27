import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { DateTime } from "luxon";
import { AuthContext } from "./SharedService";

@inject()
export default class ScheduleMovementsService {
	public async searchScheduleMovements(
		authCtx: AuthContext,
		data: {
			schedule?: string;
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
		const qb = Database.from("schedules_movements")
			.select("schedule_id", "movement_id", "type")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.whereNull("deleted_at");

		if (data.schedule) {
			qb.where("schedule_id", data.schedule);
		}

		if (data.movement) {
			qb.where("movement_id", data.movement);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		return qb;
	}

	public async createScheduleMovements(
		authCtx: AuthContext,
		data: {
			scheduleId: string;
			movementId: string;
			type: string;
		}[],
	) {
		await Database.table("schedules_movements")
			.returning("id")
			.multiInsert(
				data.map((elem) => ({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					creation_user_id: authCtx.user.id,
					schedule_id: elem.scheduleId,
					movement_id: elem.movementId,
					type: elem.type,
					created_at: DateTime.now(),
					updated_at: DateTime.now(),
				})),
			);
	}

	public async cancelScheduleMovements(
		authCtx: AuthContext,
		data: {
			scheduleId: string;
			movementId: string;
			type: string;
		}[],
	) {
		await Database.from("schedules_movements")
			.whereNull("deleted_at")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.whereIn(
				"schedule_id",
				data.map((d) => d.scheduleId),
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
				deletion_user_id: authCtx.user.id,
				deleted_at: DateTime.now(),
			});
	}
}
