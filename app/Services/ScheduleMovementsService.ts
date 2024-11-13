import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { AuthContext } from "./SharedService";

@inject()
export default class ScheduleMovementsService {
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
				})),
			);
	}
}
