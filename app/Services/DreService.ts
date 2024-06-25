import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import SharedService, { AuthContext } from "App/Services/SharedService";

@inject()
export default class DreService {
	constructor(private shared: SharedService) {}

	public async generateDreSpreadsheet(authCtx: AuthContext) {
		return Database.from("finances")
			.select(
				Database.raw(`substring(competence_date, 1, 2)                                                      mes,
       substring(competence_date, 4, 4)                                                      ano,
       ('01' || '/' || competence_date) as                                                   data,
       case when pc.parent_id is null then pc.description else pcPai.description end         plano_contas_grupo,
       finances.historic                                                                            historico,
       patients."name"                                                                              Pessoa,
       ''                                                                                    col_g,
       ''                                                                                    col_h,
       ''                                                                                    col_i,
       ''                                                                                    col_j,
       ''                                                                                    col_k,
       case when finances."type" = 'DEBITO' then TO_CHAR(finances.total_value, '9999990D99') else '0' end  valor_pago,
       case when finances."type" = 'CREDITO' then TO_CHAR(finances.total_value, '9999990D99') else '0' end valor_recebido,
       case
           when finances."type" = 'DEBITO' then TO_CHAR(finances.total_value * (-1), '9999990D99')
           else TO_CHAR(finances.total_value, '9999990D99') end                                     total,
       pc.description                                                                        plano_contas`),
			)
			.joinRaw(`left join (account_plans pc left join account_plan_groups gpc on pc.account_plan_group_id = gpc.id
    left join account_plans pcPai on pc.parent_id = pcPai.id) on finances.account_plan_id = pc."id"`)
			.joinRaw('join patients on finances.client_id = patients."id"')
			.joinRaw(
				"join economic_groups on finances.economic_group_id = economic_groups.id",
			)
			.joinRaw("join systems on economic_groups.system_id = systems.id")
			.joinRaw(
				"join business_units on finances.business_unit_id = business_units.id",
			)
			.whereIn("finances.business_unit_id", [authCtx.unit.id])
			.whereNull("finances.deleted_at")
			.where("finances.competence_date", `0${4}/2024`)
			.orderByRaw(
				'finances."type", finances.issue_date, finances."document", finances.installment',
			);
	}
}
