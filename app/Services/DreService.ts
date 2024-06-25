import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import SharedService, { AuthContext } from "App/Services/SharedService";
import * as XLSX from "xlsx";
import * as fs from "node:fs";
import { v4 } from "uuid";
import Env from "@ioc:Adonis/Core/Env";
import Application from "@ioc:Adonis/Core/Application";

type DreRow = {
	mes: string;
	ano: string;
	data: string;
	plano_contas_grupo: string;
	historico: string | null;
	pessoa: string;
	col_g: string;
	col_h: string;
	col_i: string;
	col_j: string;
	col_k: string;
	valor_pago: string;
	valor_recebido: string;
	total: string;
	plano_contas: string;
};

@inject()
export default class DreService {
	constructor(private shared: SharedService) {
		// XLSX.set_fs(fs);
	}

	public async generateDreSpreadsheet(authCtx: AuthContext) {
		// return Database.from("finances")
		// 	.select(
		// 		Database.raw(`substring(competence_date, 1, 2)                                                      mes,
		//      substring(competence_date, 4, 4)                                                      ano,
		//      ('01' || '/' || competence_date) as                                                   data,
		//      case when pc.parent_id is null then pc.description else pcPai.description end         plano_contas_grupo,
		//      finances.historic                                                                            historico,
		//      patients."name"                                                                              Pessoa,
		//      ''                                                                                    col_g,
		//      ''                                                                                    col_h,
		//      ''                                                                                    col_i,
		//      ''                                                                                    col_j,
		//      ''                                                                                    col_k,
		//      case when finances."type" = 'DEBITO' then TO_CHAR(finances.total_value, '9999990D99') else '0' end  valor_pago,
		//      case when finances."type" = 'CREDITO' then TO_CHAR(finances.total_value, '9999990D99') else '0' end valor_recebido,
		//      case
		//          when finances."type" = 'DEBITO' then TO_CHAR(finances.total_value * (-1), '9999990D99')
		//          else TO_CHAR(finances.total_value, '9999990D99') end                                     total,
		//      pc.description                                                                        plano_contas`),
		// 	)
		// 	.joinRaw(`left join (account_plans pc left join account_plan_groups gpc on pc.account_plan_group_id = gpc.id
		//   left join account_plans pcPai on pc.parent_id = pcPai.id) on finances.account_plan_id = pc."id"`)
		// 	.joinRaw('join patients on finances.client_id = patients."id"')
		// 	.joinRaw(
		// 		"join economic_groups on finances.economic_group_id = economic_groups.id",
		// 	)
		// 	.joinRaw("join systems on economic_groups.system_id = systems.id")
		// 	.joinRaw(
		// 		"join business_units on finances.business_unit_id = business_units.id",
		// 	)
		// 	.whereIn("finances.business_unit_id", [authCtx.unit.id])
		// 	.whereNull("finances.deleted_at")
		// 	.where("finances.competence_date", `0${4}/2024`)
		// 	.orderByRaw(
		// 		'finances."type", finances.issue_date, finances."document", finances.installment',
		// 	);

		const data: DreRow[] = [
			{
				mes: "04",
				ano: "2024",
				data: "01/04/2024",
				plano_contas_grupo: "Receitas Financeiras",
				historico: null,
				pessoa: "clark kent",
				col_g: "",
				col_h: "",
				col_i: "",
				col_j: "",
				col_k: "",
				valor_pago: "0",
				valor_recebido: "     250,00",
				total: "     250,00",
				plano_contas: "Receitas Financeiras",
			},
			{
				mes: "04",
				ano: "2024",
				data: "01/04/2024",
				plano_contas_grupo: "Receitas Produtos",
				historico: null,
				pessoa: "alberto luciano",
				col_g: "",
				col_h: "",
				col_i: "",
				col_j: "",
				col_k: "",
				valor_pago: "0",
				valor_recebido: "     150,00",
				total: "     150,00",
				plano_contas: "Receitas Produtos",
			},
		];

		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet([]);

		const headers = [
			"Mês",
			"Ano",
			"data",
			"cob - CATEGORIA",
			"DESCRIÇÃO",
			"FORNECEDOR",
			"",
			"ITEM",
			"CENTRO CUSTO",
			"",
			"l",
			"DEBITO",
			"CREDITO",
			"D-C",
			"Grupo de conta",
		];
		XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

		XLSX.utils.sheet_add_aoa(
			worksheet,
			data.map((d) => Object.values(d)),
			{
				origin: -1,
			},
		);
		XLSX.utils.book_append_sheet(workbook, worksheet, "DRE 2024");

		const fileKey = `${v4()}.xlsx`;
		// const fullPath = `${Application.tmpPath()}/${fileKey}`;
		const fullPath = `${Env.get(
			"LOCAL_DISK_ROOT",
			Application.tmpPath(),
		)}/${fileKey}`;
		await XLSX.writeFile(workbook, fullPath, { compression: true });
		// const stream = fs.createReadStream(fullPath, {});

		// esperar 10 segundos e tentar deletar
		setTimeout(() => {
			try {
				fs.unlinkSync(fullPath);
			} catch (_e) {
				//
			}
		}, 10_000);

		return fullPath;
	}
}
