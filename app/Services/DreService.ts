import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { AuthContext } from "App/Services/SharedService";
import * as fs from "node:fs";
import { v4, validate } from "uuid";
import Env from "@ioc:Adonis/Core/Env";
import { exec } from "node:child_process";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import BadRequestException from "App/Exceptions/BadRequestException";
import axios, { Axios } from "axios";
import FormData from "form-data";

@inject()
export default class DreService {
	private axios: Axios;

	constructor() {
		this.axios = axios.create({
			baseURL: "https://api.freeconvert.com/v1",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${"api_production_7e976d1c469bb556be2fc2b99476d2e97ba492e6a559793ac44785c661cfe3cd.668d9779b82b25606c74e67c.668d97b9b82b25606c74e711"}`,
			},
		});
	}

	public async generateDreSpreadsheet(
		authCtx: AuthContext,
		unitID: string,
		$data: { competence?: string },
	) {
		if (!validate(unitID)) {
			throw new BadRequestException("Unidade inválida", 400, "E_ERR");
		}

		if (!$data.competence) {
			throw new BadRequestException("Competência obrigatória", 400, "E_ERR");
		}

		if (!authCtx.unit.unitConfig.dreReportFile) {
			throw new BadRequestException(
				"Unidade sem arquivo DRE configurado",
				400,
				"E_RR",
			);
		}

		const data = await Database.from("finances")
			.select(
				Database.raw(`substring(competence_date, 1, 2)::int                                                      mes,
		     substring(competence_date, 4, 4) ano,
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
			.where("finances.economic_group_id", authCtx.group.id)
			.where("finances.business_unit_id", unitID)
			.whereNull("finances.deleted_at")
			.where("finances.competence_date", $data.competence ?? "")
			.orderByRaw(
				'finances."type", finances.issue_date, finances."document", finances.installment',
			);

		const excelCompiler = Env.get("EXCEL_COMPILER_PATH");
		const baseDreExcel = authCtx.unit.unitConfig.dreReportFile;
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
				`${excelCompiler} ${$data.competence ?? ""} ${baseDreExcel} /tmp/${genKey}.json`,
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

		const jobResponse = await this.axios.post("/process/jobs", {
			tasks: {
				"import-1": {
					operation: "import/upload",
				},
				"convert-1": {
					operation: "convert",
					input: "import-1",
					input_format: "xlsx",
					output_format: "pdf",
					options: {
						optimize_for: "print",
					},
				},
				"export-1": {
					operation: "export/url",
					input: ["convert-1"],
				},
			},
		});

		const job = jobResponse.data;

		// console.log("Job created", job.id, JSON.stringify(job));
		const uploadTask = job.tasks.find((t) => t.name === "import-1");

		const formData = new FormData();
		for (const parameter in uploadTask.result.form.parameters) {
			formData.append(parameter, uploadTask.result.form.parameters[parameter]);
		}

		formData.append("file", fs.createReadStream(result.path));

		await this.axios.post(uploadTask.result.form.url, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});

		let pdfUrl = "";
		for (let i = 0; i < 10; i++) {
			await this.waitForSeconds(2);
			const jobGetResponse = await this.axios.get(`/process/jobs/${job.id}`);

			const responseJobData = jobGetResponse.data;

			if (responseJobData.status === "completed") {
				const exportTask = responseJobData.tasks.find(
					(t) => t.name === "export-1",
				);
				if (exportTask) {
					pdfUrl = exportTask.result.url;
				}
				break;
			}

			if (responseJobData.status === "failed") {
				console.log({ responseJobData });
				throw new InternalErrorException("Erro gerando pdf", 500, "E_ERR");
			}
		}

		if (pdfUrl === "") {
			throw new InternalErrorException("Erro gerando pdf", 500, "E_ERR");
		}

		try {
			fs.unlinkSync(result.path);
		} catch (err) {
			console.error("Erro limpando arquivo", err);
		}

		return {
			result: pdfUrl,
		};
	}

	private async waitForSeconds(seconds: number) {
		await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
	}
}
