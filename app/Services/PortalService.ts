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
			this.billingRanking(authCtx, data),
			this.sellerBillingRanking(authCtx, data),
			this.avgTicket(authCtx, data),
			this.salesByPeriod(authCtx, data),
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
										value: row.total_bills,
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
										value: row.tkt_medio,
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
			total_bills: number;
			tkt_medio: number;
			projecao: number;
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
										value: row.total_bills ?? 0,
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
										value: row.tkt_medio ?? 0,
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
										value: row.projecao ?? 0,
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
			total: total_bills,
			data: result.map((row) =>
				Object.assign(row, {
					participacao:
						total_bills > 0 ? (row.total_bills / total_bills) * 100 : 0,
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
			total_bills: number;
			tkt_medio: number;
		}[] = await qb;

		return {
			name: "RankingVendedores",
			description: "Ranking Vendedores por Faturamento",
			type: "table",
			hasData: result.length > 0,
			data: result,
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
			tkt_medio: number;
		}[] = await qb;

		return {
			name: "RankingTicketMedio",
			description: "Ranking Unidades por Ticket Médio",
			type: "table",
			hasData: result.length > 0,
			data: result,
		};
	}

	public async salesByPeriod(
		_authCtx: { systemID: number; user: User },
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
			madrugada_total: string;
			madrugada_novos: string;
			madrugada_recorrentes: string;
			manha_total: string;
			manha_novos: string;
			manha_recorrentes: string;
			tarde_total: string;
			tarde_novos: string;
			tarde_recorrentes: string;
			noite_total: string;
			noite_novos: string;
			noite_recorrentes: string;
		}[] = await qb;

		const sum =
			result.length > 0
				? [
						result[0].madrugada_total,
						result[0].manha_total,
						result[0].tarde_total,
						result[0].noite_total,
					].reduce((acc, curr) => {
						return acc.plus(new Decimal(curr));
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
										total: result[0].madrugada_total,
										new: result[0].madrugada_novos,
										recurrent: result[0].madrugada_recorrentes,
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].madrugada_total)
												.div(sum)
												.times(100)
												.toNumber(),
										),
									},
									morning: {
										total: result[0].manha_total,
										new: result[0].manha_novos,
										recurrent: result[0].manha_recorrentes,
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].manha_total)
												.div(sum)
												.times(100)
												.toNumber(),
										),
									},
									afternoon: {
										total: result[0].tarde_total,
										new: result[0].tarde_novos,
										recurrent: result[0].tarde_recorrentes,
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].tarde_total)
												.div(sum)
												.times(100)
												.toNumber(),
										),
									},
									night: {
										total: result[0].noite_total,
										new: result[0].noite_novos,
										recurrent: result[0].noite_recorrentes,
										percentage: this.shared.formatPercentage(
											new Decimal(result[0].noite_total)
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
}
