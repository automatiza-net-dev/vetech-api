import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import PatientGender from "App/Models/PatientGender";
import { AuthContext } from "./SharedService";

@inject()
export default class PatientGenderService {
	public async distinctGenders(
		authCtx: AuthContext,
		data: {
			type?: string;
		},
	) {
		const qb = Database.from(PatientGender.table)
			.select(Database.raw("distinct description"))
			.whereRaw(
				"system_id = ? and (economic_group_id = ? or economic_group_id is null) and deleted_at is null",
				[authCtx.system.id, authCtx.group.id],
			);

		if (data.type) {
			qb.whereRaw("type = ?", [data.type]);
		}

		return (await qb).map((row) => row.description);
	}
}
