import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { AuthContext } from "./SharedService";

@inject()
export default class PortalService {
	public async billingRanking(
		authCtx: AuthContext,
		data: {
			units?: string[];
			from?: string;
			to?: string;
		},
	): Promise<
		{
			grupo_economico: string;
			unidade_negocios: string;
			business_unit_id: string;
			total_bills: number;
		}[]
	> {
		const qb = Database.from("bills")
			.select(
				Database.raw(`economic_groups.company_name  as grupo_economico,
       business_units.identification as unidade_negocios,
       business_units.id             as business_unit_id,
       sum(bills.total_value)::float as total_bills`),
			)
			.joinRaw(
				"join business_units on business_units.id = bills.business_unit_id",
			)
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.joinRaw(
				"join economic_groups on business_units.economic_group_id = economic_groups.id",
			)
			.where("economic_groups.system_id", authCtx.user.system_id)
			.whereNull("bills.deleted_at")
			.where("business_units.environment", "P")
			.groupByRaw("economic_groups.id, business_units.id")
			.orderByRaw("total_bills");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			qb.whereIn("business_units.id", data.units);
		}

		if (data.from && data.to) {
			qb.whereRaw("bill_date::date between ? and ?", [data.from, data.to]);
		}

		return await qb;
	}
}
