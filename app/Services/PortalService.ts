import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import User from "App/Models/User";
import { endOfMonth } from "date-fns";
import Decimal from "decimal.js";
import SharedService from "./SharedService";

@inject()
export default class PortalService {
	constructor(private shared: SharedService) {}

	public async dashboard(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const [billing, monthlyBilling, ...rest] = await Promise.all([
			this.billing(authCtx, data),
			this.monthlyBilling(authCtx, data),
			this.attendanceRanking(authCtx, data),
			this.billingRanking(authCtx, data),
			this.sellerBillingRanking(authCtx, data),
			this.avgTicket(authCtx, data),
			this.salesByPeriod(authCtx, data),
			this.subgroupRanking(authCtx, data),
		]);

		return {
			top: billing.top,
			cards: monthlyBilling.cards,
			tables: [...rest],
		};
	}

	public async billing(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					"sum(total_value)::float as total_bills, sum(total_value) / count(distinct client_id)::float as tkt_medio",
					[],
				),
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
			.where("business_units.environment", "P");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const generalResult: {
			total_bills: number;
			tkt_medio: number;
		}[] = await qb;

		return {
			top: generalResult
				.flatMap((row) => {
					return [
						[
							{
								name: "Faturamento",
								items: [
									{
										description: "Faturamento Realizado",
										value: this.shared.formatter.format(row.total_bills),
									},
								],
							},
						],
						[
							{
								name: "TicketMedio",
								items: [
									{
										description: "Ticket Medio",
										value: this.shared.formatter.format(row.tkt_medio),
									},
								],
							},
						],
					];
				})
				.flat(),
		};
	}

	public async monthlyBilling(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const today = new Date();

		const qb = Database.from("bills")
			.select(
				Database.raw(
					"sum(total_value)::float as total_bills, sum(total_value) / count(distinct client_id)::float as tkt_medio, sum(bills.total_value) / ? * ? as projecao",
					[today.getDay(), endOfMonth(today).getDay()],
				),
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
			.whereRaw("to_char(bill_date, 'MMYYYY') = to_char(now(), 'MMYYYY')");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}
		const monthResult: {
			total_bills: number | null;
			tkt_medio: number | null;
			projecao: number | null;
		}[] = await qb;

		return {
			cards: monthResult
				.flatMap((row) => {
					return [
						[
							{
								name: "FaturamentoMesCorrente",
								items: [
									{
										description: "Faturamento Realizado do Mes Corrente",
										value: this.shared.formatter.format(row.total_bills ?? 0),
									},
								],
							},
						],
						[
							{
								name: "TicketMedioMesCorrente",
								items: [
									{
										description: "Ticket Medio Mes Corrente",
										value: this.shared.formatter.format(row.tkt_medio ?? 0),
									},
								],
							},
						],
						[
							{
								name: "ProjecaoMesCorrente",
								items: [
									{
										description: "Projeção Faturamento Mês Corrente",
										value: this.shared.formatter.format(row.projecao ?? 0),
									},
								],
							},
						],
					];
				})
				.flat(),
		};
	}

	public async billingRanking(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const sumQb = Database.from("bills")
			.select(Database.raw("sum(total_value)::float as total_bills"))
			.joinRaw(
				"join business_units on business_units.id = bills.business_unit_id",
			)
			.joinRaw(
				"join economic_groups on business_units.economic_group_id = economic_groups.id",
			)
			.where("economic_groups.system_id", authCtx.user.system_id)
			.whereNull("bills.deleted_at")
			.where("business_units.environment", "P")
			.orderByRaw("total_bills desc");

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
			.orderByRaw("total_bills desc");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			sumQb.whereIn("business_units.id", data.units);
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			sumQb.whereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			qb.whereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const [{ total_bills = 0 }] = await sumQb;

		const result: {
			grupo_economico: string;
			unidade_negocios: string;
			business_unit_id: string;
			total_bills: number;
		}[] = await qb;

		return {
			name: "RankingFaturamento",
			description: "Ranking Unidades por Faturamento",
			type: "table",
			hasData: result.length > 0,
			total: this.shared.formatter.format(total_bills),
			data: result.map((row) =>
				Object.assign(row, {
					total_bills: this.shared.formatter.format(row.total_bills),
					participacao:
						total_bills > 0
							? this.shared.formatPercentage(
									(row.total_bills / total_bills) * 100,
								)
							: 0,
				}),
			),
		};
	}

	public async sellerBillingRanking(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(`economic_groups.company_name                                           as grupo_economico,
       business_units.id                                         as id_unidade_negocios,
       business_units.identification                             as unidade_negocios,
       users.id                                                  as id_vendedor,
       users.name                                                as nome_vendedor,
       sum(bills.total_value)                                    as total_bills,
       sum(bills.total_value) / count(distinct bills.client_id) as tkt_medio`),
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
			.joinRaw("join users on users.id = bills.user_id")
			.where("economic_groups.system_id", authCtx.user.system_id)
			.whereNull("bills.deleted_at")
			.where("business_units.environment", "P")
			.groupByRaw(
				"economic_groups.company_name, business_units.identification, business_units.id, users.name, users.id",
			)
			.orderByRaw("total_bills desc");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result: {
			grupo_economico: string | null;
			id_unidade_negocios: string;
			unidade_negocios: string | null;
			id_vendedor: string;
			nome_vendedor: string | null;
			total_bills: string | null;
			tkt_medio: string | null;
		}[] = await qb;

		return {
			name: "RankingVendedores",
			description: "Ranking Vendedores por Faturamento",
			type: "table",
			hasData: result.length > 0,
			data: result.map((row) =>
				Object.assign(row, {
					total_bills: this.shared.formatter.format(
						row.total_bills ? Number.parseFloat(row.total_bills) : 0,
					),
					tkt_medio: this.shared.formatter.format(
						row.tkt_medio ? Number.parseFloat(row.tkt_medio) : 0,
					),
				}),
			),
		};
	}

	public async avgTicket(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(`economic_groups.company_name                              as grupo_economico,
       business_units.identification                             as unidade_negocios,
       business_units.id                                         as business_unit_id,
       sum(bills.total_value) / count(distinct bills.client_id) as tkt_medio`),
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
			.orderByRaw("tkt_medio desc");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result: {
			grupo_economico: string;
			unidade_negocios: string;
			business_unit_id: string;
			tkt_medio: string | null;
		}[] = await qb;

		return {
			name: "RankingTicketMedio",
			description: "Ranking Unidades por Ticket Médio",
			type: "table",
			hasData: result.length > 0,
			data: result.map((row) =>
				Object.assign(row, {
					tkt_medio: this.shared.formatter.format(
						row.tkt_medio ? Number.parseFloat(row.tkt_medio) : 0,
					),
				}),
			),
		};
	}

	public async salesByPeriod(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(`sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then bills.total_value
               else 0 end) as "madrugada_total",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then bills.total_value
               else 0 end) as "madrugada_novos",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then bills.total_value
               else 0 end) as "madrugada_recorrentes",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then bills.total_value
               else 0 end) as "manha_total",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then bills.total_value
               else 0 end) as "manha_novos",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then bills.total_value
               else 0 end) as "manha_recorrentes",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then bills.total_value
               else 0 end) as "tarde_total",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then bills.total_value
               else 0 end) as "tarde_novos",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then bills.total_value
               else 0 end) as "tarde_recorrentes",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then bills.total_value
               else 0 end) as "noite_total",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then bills.total_value
               else 0 end) as "noite_novos",
       sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then bills.total_value
               else 0 end) as "noite_recorrentes"`),
			)
			.joinRaw("join patients on patients.id = bills.client_id")
			.joinRaw(
				"join business_units on bills.business_unit_id = business_units.id",
			)
			.joinRaw(
				"join economic_groups on business_units.economic_group_id = economic_groups.id",
			)
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.where("economic_groups.system_id", authCtx.systemID)
			.whereRaw("business_units.environment = ?", ["P"])
			.whereNull("bills.deleted_at");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result: {
			madrugada_total: string | null;
			madrugada_novos: string | null;
			madrugada_recorrentes: string | null;
			manha_total: string | null;
			manha_novos: string | null;
			manha_recorrentes: string | null;
			tarde_total: string | null;
			tarde_novos: string | null;
			tarde_recorrentes: string | null;
			noite_total: string | null;
			noite_novos: string | null;
			noite_recorrentes: string | null;
		}[] = await qb;

		const sum =
			result.length > 0
				? [
						result[0].madrugada_total,
						result[0].manha_total,
						result[0].tarde_total,
						result[0].noite_total,
					].reduce((acc, curr) => {
						return curr ? acc.plus(new Decimal(curr)) : acc;
					}, new Decimal(0))
				: 0;

		return {
			name: "portal-sales-per-period",
			description: "Vendas por Periodo",
			type: "table",
			hasData: result.length > 0,
			data:
				result.length === 0
					? []
					: [
							{
								period: {
									dawn: {
										total: this.shared.formatter.format(
											Number.parseFloat(result[0].madrugada_total ?? "0"),
										),
										new: this.shared.formatter.format(
											Number.parseFloat(result[0].madrugada_novos ?? "0"),
										),
										recurrent: this.shared.formatter.format(
											Number.parseFloat(result[0].madrugada_recorrentes ?? "0"),
										),
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].madrugada_total ?? 0)
												.div(sum)
												.times(100)
												.toNumber(),
										),
									},
									morning: {
										total: this.shared.formatter.format(
											Number.parseFloat(result[0].manha_total ?? "0"),
										),
										new: this.shared.formatter.format(
											Number.parseFloat(result[0].manha_novos ?? "0"),
										),
										recurrent: this.shared.formatter.format(
											Number.parseFloat(result[0].manha_recorrentes ?? "0"),
										),
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].manha_total ?? 0)
												.div(sum)
												.times(100)
												.toNumber(),
										),
									},
									afternoon: {
										total: this.shared.formatter.format(
											Number.parseFloat(result[0].tarde_total ?? "0"),
										),
										new: this.shared.formatter.format(
											Number.parseFloat(result[0].tarde_novos ?? "0"),
										),
										recurrent: this.shared.formatter.format(
											Number.parseFloat(result[0].tarde_recorrentes ?? "0"),
										),
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].tarde_total ?? 0)
												.div(sum)
												.times(100)
												.toNumber(),
										),
									},
									night: {
										total: this.shared.formatter.format(
											Number.parseFloat(result[0].noite_total ?? "0"),
										),
										new: this.shared.formatter.format(
											Number.parseFloat(result[0].noite_novos ?? "0"),
										),
										recurrent: this.shared.formatter.format(
											Number.parseFloat(result[0].noite_recorrentes ?? "0"),
										),
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].noite_total ?? 0)
												.div(sum)
												.times(100)
												.toNumber(),
										),
									},
								},
							},
						],
		};
	}

	public async attendanceRanking(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const sumQb = Database.from("attendances")
			.select(
				Database.raw(`count(attendances.id) as qtd,
       sum(case
               when to_char(patients.created_at, 'MMYYYY') = to_char(attendances.start_date, 'MMYYYY') then 1
               else 0 end)   as qtd_novos,
       sum(case
               when to_char(patients.created_at, 'MMYYYY') <> to_char(attendances.start_date, 'MMYYYY') then 1
               else 0 end)   as qtd_recorrentes`),
			)
			.joinRaw("join patients on attendances.patient_id = patients.id")
			.joinRaw(
				"join business_units on business_units.id = attendances.business_unit_id",
			)
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.joinRaw(
				"join economic_groups on business_units.economic_group_id = economic_groups.id",
			)
			.where("economic_groups.system_id", authCtx.systemID)
			.whereNull("attendances.deleted_at")
			.where("business_units.environment", "P");

		const qb = Database.from("attendances")
			.select(
				Database.raw(`economic_groups.company_name  as grupo_economico,
       business_units.id             as id_unidade_negocios,
       business_units.identification as unidade_negocios,
       count(attendances.id)         as qtd_total,
       sum(case
               when to_char(patients.created_at, 'MMYYYY') = to_char(attendances.start_date, 'MMYYYY') then 1
               else 0 end)           as qtd_novos,
       sum(case
               when to_char(patients.created_at, 'MMYYYY') <> to_char(attendances.start_date, 'MMYYYY') then 1
               else 0 end)           as qtd_recorrentes`),
			)

			.joinRaw("join patients on attendances.patient_id = patients.id")
			.joinRaw(
				"join business_units on business_units.id = attendances.business_unit_id",
			)
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.joinRaw(
				"join economic_groups on business_units.economic_group_id = economic_groups.id",
			)
			.where("economic_groups.system_id", authCtx.systemID)
			.whereNull("attendances.deleted_at")
			.where("business_units.environment", "P")
			.groupByRaw(
				"economic_groups.company_name, business_units.identification, business_units.id",
			)
			.orderByRaw("qtd_total desc");

		// if (data.units && Array.isArray(data.units) && data.units.length > 0) {
		// 	sumQb.whereIn("business_units.id", data.units);
		// 	qb.whereIn("business_units.id", data.units);
		// }

		if (data.fromDate && data.toDate) {
			sumQb.whereRaw("attendances.start_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			qb.whereRaw("attendances.start_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const totalQty: {
			qtd: string;
			qtd_novos: string;
			qtd_recorrentes: string;
		}[] = await sumQb;

		const result: {
			grupo_economico: string | null;
			id_unidade_negocios: string;
			unidade_negocios: string | null;
			qtd_total: string;
			qtd_novos: string;
			qtd_recorrentes: string;
		}[] = await qb;

		const total = totalQty.at(0)?.qtd ?? 0;
		const novos = totalQty.at(0)?.qtd_novos ?? 0;
		const recorrentes = totalQty.at(0)?.qtd_recorrentes ?? 0;

		return {
			name: "RankingAtendimentos",
			description: "Ranking Unidades por Atendimentos",
			type: "table",
			hasData: result.length > 0,
			total,
			novos,
			recorrentes,
			data: result.map((row) => ({
				grupo_economico: row.grupo_economico,
				unidade_negocios: row.unidade_negocios,
				business_unit_id: row.id_unidade_negocios,
				total: row.qtd_total,
				participacaoTotal: this.shared.formatPercentage(
					new Decimal(row.qtd_total)
						.div(new Decimal(total))
						.times(100)
						.toNumber(),
				),
				novos: row.qtd_novos,
				participacaoNovos: this.shared.formatPercentage(
					new Decimal(row.qtd_novos)
						.div(new Decimal(novos))
						.times(100)
						.toNumber(),
				),
				recorrentes: row.qtd_recorrentes,
				participacaoRecorrentes: this.shared.formatPercentage(
					new Decimal(row.qtd_recorrentes)
						.div(new Decimal(recorrentes))
						.times(100)
						.toNumber(),
				),
			})),
		};
	}

	public async subgroupRanking(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const sumQb = Database.from("bills")
			.select(Database.raw("sum(bill_items.total_value) as total"))
			.joinRaw(
				"join bill_items on bill_items.bill_id = bills.id and bill_items.status = 'ATIVA' and bill_items.deleted_at is null",
			)
			.joinRaw(
				"inner join product_variations on product_variations.id = bill_items.product_variation_id",
			)
			.joinRaw(
				"inner join products on products.id = product_variations.product_id",
			)
			.joinRaw("inner join subgroups on subgroups.id = products.subgroup_id ")
			.joinRaw(
				"inner join business_units on business_units.id = bills.business_unit_id ",
			)
			.joinRaw(
				"inner join economic_groups on business_units.economic_group_id = economic_groups.id ",
			)
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.where("economic_groups.system_id", authCtx.systemID)
			.whereNull("bills.deleted_at")
			.where("business_units.environment", "P");

		const qb = Database.from("bills")
			.select(
				Database.raw(`subgroups.id as s_id, subgroups.description, count(bill_items.id) as count, sum(bill_items.quantity) as quantity,
sum(bill_items.total_value) as total, count(distinct bills.client_id) as clients`),
			)
			.joinRaw(
				"join bill_items on bill_items.bill_id = bills.id and bill_items.status = 'ATIVA' and bill_items.deleted_at is null",
			)
			.joinRaw(
				"inner join product_variations on product_variations.id = bill_items.product_variation_id",
			)
			.joinRaw(
				"inner join products on products.id = product_variations.product_id",
			)
			.joinRaw("inner join subgroups on subgroups.id = products.subgroup_id ")
			.joinRaw(
				"inner join business_units on business_units.id = bills.business_unit_id ",
			)
			.joinRaw(
				"inner join economic_groups on business_units.economic_group_id = economic_groups.id ",
			)
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.where("business_units.environment", "P")
			.groupByRaw("subgroups.id, subgroups.description")
			.orderByRaw("total desc, description desc");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			sumQb.whereIn("business_units.id", data.units);
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			sumQb.whereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			qb.whereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const totalQty: {
			total: string;
		}[] = await sumQb;

		const result: {
			s_id: string;
			description: string;
			count: string;
			quantity: string;
			total: number;
			clients: string;
		}[] = await qb;

		const total =
			totalQty.length === 0
				? new Decimal(0)
				: new Decimal(totalQty[0].total ?? 0);

		return {
			name: "PortalSubgrupos",
			description: "Vendas por Subgrupo",
			type: "table",
			hasData: result.length > 0,
			data: result.map((row) => ({
				id: row.s_id,
				description: row.description,
				count: Number.parseInt(row.count),
				quantity: Number.parseFloat(row.quantity).toFixed(2),
				total: this.shared.formatter.format(row.total),
				uniqueClients: Number.parseInt(row.clients),
				percentage: this.shared.formatPercentage(
					new Decimal(row.total).div(total).times(new Decimal(100)).toNumber(),
				),
			})),
		};
	}

	public async invoicingProductTypeSubgroup(
		authCtx: { systemID: number; user: User },
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
			subgroup?: string;
		},
	) {
		const sumQb = Database.from("bill_items")
			.select(Database.raw("sum(bill_items.total_value) as total"))
			.joinRaw("left join bills on bills.id = bill_items.bill_id")
			.joinRaw(
				"left join product_variations on product_variations.id = bill_items.product_variation_id",
			)
			.joinRaw(
				"left join products on products.id = product_variations.product_id",
			)
			.joinRaw(
				"left join business_unit_products on business_unit_products.product_variation_id = bill_items.product_variation_id and business_unit_products.businness_unit_id = bill_items.business_unit_id",
			)
			.joinRaw(
				"left join business_units on business_units.id = bills.business_unit_id",
			)
			.joinRaw(
				"left join economic_groups on economic_groups.id = business_units.economic_group_id",
			)
			.joinRaw("left join subgroups on subgroups.id = products.subgroup_id ")
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.where("economic_groups.system_id", authCtx.systemID)
			.whereNull("bills.deleted_at")
			.whereNull("bill_items.deleted_at")
			.where("business_units.environment", "P");

		const qb = Database.from("bill_items")
			.select(
				Database.raw(
					"products.id as p_id, products.description, subgroups.description as subgroup, sum(bill_items.quantity) as qty_sales, sum(bill_items.total_value) as total_sales, count(distinct bills.client_id) as qty_clients",
				),
			)
			.joinRaw("left join bills on bills.id = bill_items.bill_id")
			.joinRaw(
				"left join product_variations on product_variations.id = bill_items.product_variation_id",
			)
			.joinRaw(
				"left join products on products.id = product_variations.product_id",
			)
			.joinRaw(
				"left join business_unit_products on business_unit_products.product_variation_id = bill_items.product_variation_id and business_unit_products.businness_unit_id = bill_items.business_unit_id",
			)
			.joinRaw(
				"left join business_units on business_units.id = bills.business_unit_id",
			)
			.joinRaw(
				"left join economic_groups on economic_groups.id = business_units.economic_group_id",
			)
			.joinRaw("left join subgroups on subgroups.id = products.subgroup_id ")
			.joinRaw(
				"join user_unit_roles on business_units.id = user_unit_roles.unit_id and user_unit_roles.user_id = ?",
				[authCtx.user.id],
			)
			.where("economic_groups.system_id", authCtx.systemID)
			.whereNull("bills.deleted_at")
			.whereNull("bill_items.deleted_at")
			.where("business_units.environment", "P")
			.groupByRaw("products.id, products.description, subgroups.description")
			.orderByRaw("total_sales desc, description desc");

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			sumQb.whereIn("business_units.id", data.units);
			qb.whereIn("business_units.id", data.units);
		}

		if (data.fromDate && data.toDate) {
			sumQb.whereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			qb.whereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		if (data.type) {
			sumQb.where("products.type", data.type);
			qb.where("products.type", data.type);
		}

		if (data.subgroup) {
			sumQb.where("products.subgroup_id", data.subgroup);
			qb.where("products.subgroup_id", data.subgroup);
		}

		const totalQty: {
			total: string;
		}[] = await sumQb;

		const result: {
			p_id: string;
			description: string;
			subgroup: string;
			qty_sales: string;
			total_sales: number;
			qty_clients: number;
		}[] = await qb;

		const total =
			totalQty.length === 0
				? new Decimal(0)
				: new Decimal(totalQty[0].total ?? 0);

		return result.map((row) => ({
			id: row.p_id,
			description: row.description,
			subgroup: row.subgroup,
			qtySales: Number.parseFloat(row.qty_sales).toFixed(2),
			qtyClients: row.qty_clients,
			totalSales: this.shared.formatter.format(row.total_sales),
			percentage: this.shared.formatPercentage(
				new Decimal(row.total_sales).div(total).times(100).toNumber(),
			),
		}));
	}

	// public async medianTicketByOrigin(
	// 	authCtx: { systemID: number; user: User },
	// 	data: {
	// 		units?: string[];
	// 		fromDate?: string;
	// 		toDate?: string;
	// 	},
	// ) {
	// 	const qb1 = Database.from("bills")
	// 		.select(
	// 			Database.raw(
	// 				`
	//            business_units.id,
	//            business_units.identification,
	//            'Recorrentes'          as description,
	//            sum(bills.total_value) as total,
	//            count(distinct bills.client_id) as qty_clients
	//          `,
	// 			),
	// 		)
	// 		.joinRaw(
	// 			`join ((patients join patient_tutors on patients.id = patient_tutors.patient_id) join client_origins
	//                on patient_tutors.client_origin_id = client_origins.id)
	//                on bills.client_id = patient_tutors.patient_id`,
	// 			[],
	// 		)
	// 		.join("business_units", (query) => {
	// 			query.on("business_units.id", "=", "bills.business_unit_id");
	// 		})
	// 		.groupBy("business_units.id")
	// 		.orderBy("total", "desc")
	// 		.whereNull("bills.deleted_at")
	// 		.andWhereRaw(
	// 			`to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM')`,
	// 			[],
	// 		);
	//
	// 	const qb2 = Database.from("bills")
	// 		.select(
	// 			Database.raw(
	// 				`
	//          business_units.id,
	//          business_units.identification,
	//          client_origins.description,
	//          sum(bills.total_value) as total,
	//          count( distinct bills.client_id ) as qty_clients
	//          `,
	// 			),
	// 		)
	// 		.joinRaw(
	// 			`join ((patients join patient_tutors on patients.id = patient_tutors.patient_id) join client_origins
	//                on patient_tutors.client_origin_id = client_origins.id)
	//                on bills.client_id = patient_tutors.patient_id`,
	// 			[],
	// 		)
	// 		.join("business_units", (query) => {
	// 			query.on("business_units.id", "=", "bills.business_unit_id");
	// 		})
	// 		.groupBy("business_units.id", "client_origins.description")
	// 		.orderBy("total", "desc")
	// 		.whereNull("bills.deleted_at")
	// 		.andWhereRaw(
	// 			`to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM')`,
	// 			[],
	// 		);
	//
	// 	if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
	// 		qb1.where("business_units.environment", "P");
	// 		qb2.where("business_units.environment", "P");
	// 	}
	//
	// 	if (data.units && Array.isArray(data.units)) {
	// 		qb1.whereIn("bills.business_unit_id", data.units);
	// 		qb2.whereIn("bills.business_unit_id", data.units);
	// 	}
	//
	// 	if (data.fromDate) {
	// 		qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
	// 		qb2.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
	// 	}
	//
	// 	if (data.toDate) {
	// 		qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
	// 		qb2.andWhereRaw("bill_date::date <= ?", [data.toDate]);
	// 	}
	//
	// 	const [r1, r2] = await Promise.all([qb1, qb2]);
	// 	const result = r1.concat(r2);
	//
	// 	const sum = result.reduce((acc, curr) => acc + curr.total, 0);
	// 	const system = await System.findOrFail(authCtx.systemID);
	//
	// 	return {
	// 		name: "portal-median-ticket-by-origin",
	// 		type: "pie",
	// 		hasData: result.length > 0,
	// 		title: "Faturamento X Origem Clientes",
	// 		legend: result.map((elem, idx) => [
	// 			{
	// 				title: "Descrição",
	// 				value: elem.description,
	// 				itemStyle: {
	// 					color: system.colors[idx % system.colors.length],
	// 				},
	// 			},
	// 			{
	// 				title: "Partic %",
	// 				value: this.shared.formatPercentage((elem.total / sum) * 100),
	// 				itemStyle: { color: "" },
	// 			},
	// 			{
	// 				title: "Total R$",
	// 				value: this.shared.formatter.format(elem.total.toFixed(2)),
	// 				itemStyle: { color: "" },
	// 			},
	// 			{
	// 				title: "Qtd Cli",
	// 				value: elem.qty_clients,
	// 				itemStyle: { color: "" },
	// 			},
	// 			{
	// 				title: "Tkt Medio R$",
	// 				value: this.shared.formatter.format(
	// 					elem.total / Number.parseInt(elem.qty_clients),
	// 				),
	// 				itemStyle: { color: "" },
	// 			},
	// 		]),
	//
	// 		configs: {
	// 			title: {
	// 				text: "Faturamento X Origem Clientes",
	// 				subtext: "",
	// 				left: "center",
	// 				show: false,
	// 			},
	// 			tooltip: {
	// 				trigger: "item",
	// 				formatter: "{a} <br/>{b} : {c} ({d}%)",
	// 			},
	// 			legend: {
	// 				bottom: 10,
	// 				orient: "horizontal",
	// 				left: "center",
	// 				show: false,
	// 			},
	// 			series: [
	// 				{
	// 					name: "Origem Clientes",
	// 					type: "pie",
	// 					radius: "80%",
	// 					label: {
	// 						formatter: "{b} : {c} ({d}%)",
	// 						show: false,
	// 					},
	// 					emphasis: {
	// 						itemStyle: {
	// 							shadowBlur: 10,
	// 							shadowOffsetX: 0,
	// 							shadowColor: "rgba(0, 0, 0, 0.5)",
	// 						},
	// 					},
	// 					data: result.map((elem, idx) => ({
	// 						value: Number.parseFloat(elem.total.toFixed(2)),
	// 						name: elem.description,
	// 						percentage: Number.parseFloat(
	// 							((elem.total / sum) * 100).toFixed(2),
	// 						),
	// 						itemStyle: {
	// 							color: system.colors[idx % system.colors.length],
	// 						},
	// 					})),
	// 				},
	// 			],
	// 		},
	// 	};
	// }

	// public async invoicingByPaymentMethod(
	// 	authCtx: { systemID: number; user: User },
	// 	data: {
	// 		units?: string[];
	// 		fromDate?: string;
	// 		toDate?: string;
	// 	},
	// ) {
	// 	const qb1 = Database.from("bills")
	// 		.select(Database.raw("sum(bills.total_value) as total_bills"))
	// 		.join("business_units", (query) => {
	// 			query.on("business_units.id", "=", "bills.business_unit_id");
	// 		})
	// 		.joinRaw(
	// 			"join economic_groups on economic_groups.id = business_units.economic_group_id",
	// 		)
	// 		.joinRaw(
	// 			"join user_unit_roles uur on uur.unit_id = business_units.id and uur.user_id = ?",
	// 			[authCtx.user.id],
	// 		)
	// 		.whereRaw("economic_groups.system_id = ?", [authCtx.systemID])
	// 		.whereNull("bills.deleted_at");
	//
	// 	const qb2 = Database.from("bills")
	// 		.select(
	// 			Database.raw(
	// 				"payment_methods.description as description, sum(bill_payments.total_value) as total_payments",
	// 			),
	// 		)
	// 		.joinRaw(
	// 			"join bill_payments on bills.id = bill_payments.bill_id and bills.business_unit_id = bill_payments.business_unit_id",
	// 			[],
	// 		)
	// 		.joinRaw(
	// 			"inner join payment_methods on payment_methods.id = bill_payments.payment_method_id",
	// 			[],
	// 		)
	// 		.joinRaw(
	// 			"inner join business_units on business_units.id = bills.business_unit_id",
	// 			[],
	// 		)
	// 		.joinRaw(
	// 			"join economic_groups on economic_groups.id = business_units.economic_group_id",
	// 			[],
	// 		)
	// 		.joinRaw(
	// 			"join user_unit_roles uur on uur.unit_id = business_units.id and uur.user_id = ?",
	// 			[authCtx.user.id],
	// 		)
	// 		.whereRaw("economic_groups.system_id = ?", [authCtx.systemID])
	// 		.whereRaw("bills.deleted_at is null", [])
	// 		.groupByRaw("payment_methods.description");
	//
	// 	const qb3 = Database.from("bills")
	// 		.select(
	// 			Database.raw(
	// 				"'Em aberto' as description, sum(bills.total_value - bills.paid_value) as total_payments",
	// 			),
	// 		)
	// 		.joinRaw(
	// 			"inner join business_units on business_units.id = bills.business_unit_id",
	// 			[],
	// 		)
	// 		.joinRaw(
	// 			"join economic_groups on economic_groups.id = business_units.economic_group_id",
	// 			[],
	// 		)
	// 		.joinRaw(
	// 			"join user_unit_roles uur on uur.unit_id = business_units.id and uur.user_id = ?",
	// 			[authCtx.user.id],
	// 		)
	// 		.whereRaw("economic_groups.system_id = ?", [authCtx.systemID])
	// 		.whereRaw("bills.deleted_at is null", []);
	//
	// 	if (data.units && Array.isArray(data.units)) {
	// 		qb1.whereIn("bills.business_unit_id", data.units);
	// 		qb2.whereIn("bills.business_unit_id", data.units);
	// 		qb3.whereIn("bills.business_unit_id", data.units);
	// 	}
	//
	// 	if (data.fromDate && data.toDate) {
	// 		qb1.whereRaw("bill_date::date between ? and ?", [
	// 			data.fromDate,
	// 			data.toDate,
	// 		]);
	// 		qb2.whereRaw("bill_date::date between ? and ?", [
	// 			data.fromDate,
	// 			data.toDate,
	// 		]);
	// 		qb3.whereRaw("bill_date::date between ? and ?", [
	// 			data.fromDate,
	// 			data.toDate,
	// 		]);
	// 	}
	//
	// 	const result1: { total_bills: string }[] = await qb1;
	// 	const result2: { description: string; total_payments: string }[] =
	// 		await qb2;
	// 	const result3: { description: string; total_payments: string }[] =
	// 		await qb3;
	//
	// 	const system = await System.findOrFail(authCtx.systemID);
	// 	const total = new Decimal(result1.at(0)?.total_bills ?? 0);
	//
	// 	const fullResult = [...result2, ...result3];
	//
	// 	return {
	// 		name: "invoicing-by-payment-method",
	// 		type: "pie",
	// 		hasData: result2.length > 0,
	// 		title: "Faturamento X Forma Pagamento",
	// 		legend: fullResult.map((elem, idx) => [
	// 			{
	// 				title: "Descrição",
	// 				value: elem.description,
	// 				itemStyle: {
	// 					color: system.colors[idx % system.colors.length],
	// 				},
	// 			},
	// 			{
	// 				title: "Partic %",
	// 				value: this.shared.formatPercentage(
	// 					new Decimal(elem.total_payments).div(total).times(100).toNumber(),
	// 				),
	// 				itemStyle: { color: "" },
	// 			},
	// 			{
	// 				title: "Total R$",
	// 				value: this.shared.formatter.format(
	// 					new Decimal(elem.total_payments).toNumber(),
	// 				),
	// 				itemStyle: { color: "" },
	// 			},
	// 			{
	// 				title: "Qtd Cli",
	// 				value: "",
	// 				itemStyle: { color: "" },
	// 			},
	// 			{
	// 				title: "Tkt Medio R$",
	// 				value: "",
	// 				itemStyle: { color: "" },
	// 			},
	// 		]),
	// 		configs: {
	// 			title: {
	// 				text: "Faturamento X Forma Pagamento",
	// 				subtext: "",
	// 				left: "center",
	// 				show: false,
	// 			},
	// 			tooltip: {
	// 				trigger: "item",
	// 				formatter: "{a} <br/>{b} : {c} ({d}%)",
	// 			},
	// 			legend: {
	// 				bottom: 10,
	// 				orient: "horizontal",
	// 				left: "center",
	// 				show: false,
	// 			},
	// 			series: [
	// 				{
	// 					name: "Forma Pagamento",
	// 					type: "pie",
	// 					radius: "80%",
	// 					label: {
	// 						formatter: "{b} : {c} ({d}%)",
	// 						show: false,
	// 					},
	// 					emphasis: {
	// 						itemStyle: {
	// 							shadowBlur: 10,
	// 							shadowOffsetX: 0,
	// 							shadowColor: "rgba(0, 0, 0, 0.5)",
	// 						},
	// 					},
	// 					data: result2.map((elem, idx) => ({
	// 						value: Number.parseFloat(elem.total_payments),
	// 						name: elem.description,
	// 						percentage: this.shared.formatPercentage(
	// 							new Decimal(elem.total_payments)
	// 								.div(total)
	// 								.times(100)
	// 								.toNumber(),
	// 						),
	// 						itemStyle: {
	// 							color: system.colors[idx % system.colors.length],
	// 						},
	// 					})),
	// 				},
	// 			],
	// 		},
	// 	};
	// }
}
