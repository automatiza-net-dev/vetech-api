import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import SharedService, { AuthContext } from "App/Services/SharedService";
import * as fs from "node:fs";
import { v4 } from "uuid";
import Env from "@ioc:Adonis/Core/Env";
import { exec } from "node:child_process";
import InternalErrorException from "App/Exceptions/InternalErrorException";

@inject()
export default class DreService {
	constructor(private _shared: SharedService) {}

	public async generateDreSpreadsheet(authCtx: AuthContext) {
		const data = await Database.from("finances")
			.select(
				Database.raw(`substring(competence_date, 1, 2)::int                                                      mes,
		     substring(competence_date, 4, 4)::int                                                      ano,
		     ('01' || '/' || competence_date) as                                                   data,
		     case when pc.parent_id is null then pc.description else pcPai.description end         plano_contas_grupo,
		     finances.historic                                                                            historico,
		     patients."name"                                                                              Pessoa,
		     ''                                                                                    col_g,
		     ''                                                                                    col_h,
		     ''                                                                                    col_i,
		     ''                                                                                    col_j,
		     ''                                                                                    col_k,
         case when finances."type" = 'DEBITO' then finances.total_value else 0 end                   valor_pago,
         case when finances."type" = 'CREDITO' then finances.total_value else 0 end                  valor_recebido,
         case
            when finances."type" = 'DEBITO' then finances.total_value * (-1)
             else finances.total_value end                                                    total,
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

		const excelCompiler = Env.get("DRE_PATH").replace("dre.xlsx", "excel");
		const baseDreExcel = Env.get("DRE_PATH");
		const genKey = v4();

		fs.writeFileSync(
			`/tmp/${genKey}.json`,
			JSON.stringify(
				data.map((d) => ({
					...d,
					mes: Number.parseInt(d.mes),
					valor_pago: Number.parseFloat(d.valor_pago),
					valor_recebido: Number.parseInt(d.valor_recebido),
					total: Number.parseFloat(d.total),
				})),
			),
		);

		const result = await new Promise<
			{ success: true; path: string } | { success: false; err: string }
		>((res) => {
			exec(
				`${excelCompiler} ${baseDreExcel} /tmp/${genKey}.json`,
				(error, _stdout, _stderr) => {
					if (error) {
						console.error(error);
						return res({ success: false, err: error.message });
					}

					if (_stderr.length > 0) {
						console.log({ _stdout, _stderr });
						return res({ success: false, err: _stderr });
					}

					return res({ success: true, path: _stdout });
				},
			);
		});

		if (!result.success) {
			throw new InternalErrorException(
				`Erro gerando pdf -> ${result.err}`,
				500,
				"E_ERR",
			);
		}

		setTimeout(() => {
			try {
				fs.unlinkSync(result.path);
			} catch (err) {
				console.error("Erro limpando arquivo", err);
			}
		}, 10_000);

		return result.path;
	}
}
