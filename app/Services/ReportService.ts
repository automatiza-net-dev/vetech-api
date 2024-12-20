import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Bill, { BillStatus } from "App/Models/Bill";
import Budget from "App/Models/Budget";
import BusinessUnit from "App/Models/BusinessUnit";
import CheckingAccount from "App/Models/CheckingAccount";
import Finance, { FinanceStatus, FinanceType } from "App/Models/Finance";
import Receipt from "App/Models/Receipt";
import SharedService from "App/Services/SharedService";
import type { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";
import { TOpportunityActivityStatus } from "App/Models/OpportunityActivity";
import AnimalTimeline from "App/Models/mongoose/AnimalTimeline";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import { string } from "@ioc:Adonis/Core/Helpers";

@inject()
export default class ReportService {
	constructor(private sharedService: SharedService) {}

	async financeReport(
		authCtx: AuthContext,
		data: {
			type?: string;
			fromIssueDate?: Date;
			toIssueDate?: Date;
			fromExpirationDate?: Date;
			toExpirationDate?: Date;
			fromPaymentDate?: Date;
			toPaymentDate?: Date;
			fromCompetenceDate?: Date;
			toCompetenceDate?: Date;
			paymentMethod?: string;
			accountPlan?: string;
			status?: string;
			businessUnits?: string[];
			economicGroups?: string[];
		},
	) {
		const qb = Finance.query()
			.preload("client")
			.preload("checkingAccount")
			.preload("paymentMethod")
			.preload("accountPlan", (query) => {
				query.preload("group");
			})
			.preload("unit", (query) => {
				query.preload("economicGroup", (query) => {
					query.preload("system");
				});
			})
			.whereHas("unit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", authCtx.system.id);
				});
			});

		if (data.type) {
			qb.where("type", data.type);
		}

		if (data.paymentMethod) {
			qb.where("payment_method_id", data.paymentMethod);
		}

		if (data.accountPlan) {
			qb.where("account_plan_id", data.accountPlan);
		}

		if (data.status) {
			qb.where("status", data.status);
		}

		if (data.businessUnits && Array.isArray(data.businessUnits)) {
			qb.whereIn("business_unit_id", data.businessUnits);
		}

		if (authCtx.user.type === "user") {
			qb.where("economic_group_id", authCtx.group.id);
		} else {
			if (data.economicGroups && Array.isArray(data.economicGroups)) {
				qb.whereIn("economic_group_id", data.economicGroups);
			} else {
				qb.where("economic_group_id", authCtx.group.id);
			}
		}

		if (data.fromIssueDate) {
			qb.where("issueDate", ">=", data.fromIssueDate);
		}

		if (data.toIssueDate) {
			qb.where("issueDate", "<=", data.toIssueDate);
		}

		if (data.fromExpirationDate) {
			qb.where("expirationDate", ">=", data.fromExpirationDate);
		}

		if (data.toExpirationDate) {
			qb.where("expirationDate", "<=", data.toExpirationDate);
		}

		if (data.fromCompetenceDate) {
			qb.where("competenceDate", ">=", data.fromCompetenceDate);
		}

		if (data.toCompetenceDate) {
			qb.where("competenceDate", "<=", data.toCompetenceDate);
		}

		if (data.fromPaymentDate) {
			qb.where("paymentDate", ">=", data.fromPaymentDate);
		}

		if (data.toPaymentDate) {
			qb.where("paymentDate", "<=", data.toPaymentDate);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			document: elem.document,
			type: elem.type,
			issueDate: elem.issueDate,
			expirationDate: elem.expirationDate,
			paymentDate: elem.paymentDate,
			competenceDate: elem.competenceDate,
			fiscalNote: elem.fiscalNote,
			value: elem.value,
			totalValue: elem.totalValue,
			discountValue: elem.discountValue,
			feeValue: elem.feeValue,
			paymentValue: elem.paymentValue,
			nsuDocument: elem.nsuDocument,
			status: elem.status,
			qtyInstallments: elem.qtyInstallments,
			installment: elem.installment,
			originFlag: elem.originFlag,
			historic: elem.historic,
			createdAt: elem.createdAt,

			system: this.sharedService.captureGroup(
				elem.unit?.economicGroup?.system,
				(v) => ({
					id: v.id,
					name: v.name,
				}),
			),
			group: this.sharedService.captureGroup(elem.unit?.economicGroup, (v) => ({
				id: v.id,
				companyName: v.companyName,
			})),
			unit: this.sharedService.captureGroup(elem.unit, (v) => ({
				id: v.id,
				identification: v.identification,
				city: v.city,
				state: v.state,
			})),
			client: this.sharedService.captureGroup(elem.client, (v) => ({
				id: v.id,
				name: v.name,
			})),
			checkingAccount: this.sharedService.captureGroup(
				elem.checkingAccount,
				(v) => ({
					id: v.id,
					description: v.description,
				}),
			),
			paymentMethod: this.sharedService.captureGroup(
				elem.paymentMethod,
				(v) => ({
					id: v.id,
					description: v.description,
				}),
			),
			accountPlan: this.sharedService.captureGroup(elem.accountPlan, (v) => ({
				id: v.id,
				description: v.description,
				group: this.sharedService.captureGroup(v.group, (v) => ({
					id: v.id,
					description: v.description,
				})),
			})),
		}));
	}

	async cashierFlowReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			businessUnit?: string;
		},
	) {
		const financeQbs = Finance.query()
			.preload("unit")
			.where("economic_group_id", authCtx.group.id)
			.whereNot("status", FinanceStatus.E)
			.whereHas("unit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", authCtx.system.id);
				});
			});

		if (authCtx.user.type === "user") {
			financeQbs.where("economic_group_id", authCtx.group.id);
		}

		if (data.businessUnit) {
			financeQbs.where("business_unit_id", data.businessUnit);
		}

		if (data.fromDate) {
			financeQbs.whereRaw("expiration_date::date >= ?", [
				DateTime.fromISO(data.fromDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toDate) {
			financeQbs.whereRaw("expiration_date::date <= ?", [
				DateTime.fromISO(data.toDate).toFormat("yyyy-MM-dd"),
			]);
		}

		const result = await financeQbs;

		const unitsSet = new Set<string>(result.map((r) => r.unit.id));
		const uniqueUnitIds = Array.from(unitsSet);
		const units = uniqueUnitIds
			.map((elem) => result.find((r) => r.unit.id === elem)?.unit)
			.filter(Boolean) as BusinessUnit[];

		return units.map((elem) => ({
			id: elem.id,
			identification: elem.identification ?? "-",
			flow: this.calculateDailyFlow(
				result.filter((r) => r.business_unit_id === elem.id),
			),
		}));
	}

	async checkingAccountReport(
		authCtx: AuthContext,
		data: {
			businessUnit?: string;
		},
	) {
		const qb = CheckingAccount.query()
			.preload("unit")
			.where("economic_group_id", authCtx.group.id)
			.whereNotNull("business_unit_id");

		if (data.businessUnit) {
			qb.where("business_unit_id", data.businessUnit);
		}

		const result = await qb;

		const unitsSet = new Set<string>(result.map((r) => r.unit.id));
		const uniqueUnitIds = Array.from(unitsSet);
		const units = uniqueUnitIds
			.map((elem) => result.find((r) => r.unit.id === elem)?.unit)
			.filter(Boolean) as BusinessUnit[];

		const dataSet = new Map<string, number>();
		result.forEach((r) => {
			const key = r.business_unit_id;
			if (!key) {
				return;
			}

			if (!dataSet.has(key)) {
				dataSet.set(key, 0);
			}

			const entry = dataSet.get(key);
			dataSet.set(key, (entry ?? 0) + r.balance);
		});

		return units.map((elem) => ({
			id: elem.id,
			identification: elem.identification ?? "-",
			total: dataSet.get(elem.id) ?? 0,
		}));
	}

	async expiredFinancesReport(
		authCtx: AuthContext,
		data: {
			businessUnit?: string;
		},
	) {
		const qb = Finance.query()
			.preload("unit")
			.where("economic_group_id", authCtx.group.id)
			.whereRaw("expiration_date::date < now()::date", [])
			.where("status", FinanceStatus.A)
			.whereNull("deleted_at");

		if (data.businessUnit) {
			qb.where("business_unit_id", data.businessUnit);
		}

		const result = await qb;

		const unitsSet = new Set<string>(result.map((r) => r.unit.id));
		const uniqueUnitIds = Array.from(unitsSet);
		const units = uniqueUnitIds
			.map((elem) => result.find((r) => r.unit.id === elem)?.unit)
			.filter(Boolean) as BusinessUnit[];

		const dataSet = new Map<string, { credit: number; debit: number }>();
		result.forEach((r) => {
			const key = r.business_unit_id;
			if (!dataSet.has(key)) {
				dataSet.set(key, { credit: 0, debit: 0 });
			}

			const entry = dataSet.get(key)!;
			if (r.type === FinanceType.C) {
				entry.credit += r.totalValue;
			} else {
				entry.debit += r.totalValue;
			}

			dataSet.set(key, entry);
		});

		return units.map((elem) => ({
			id: elem.id,
			identification: elem.identification ?? "-",
			total: dataSet.get(elem.id) ?? null,
		}));
	}

	async salesReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			status?: string;
			client?: string;
			patient?: string;
			businessUnits?: string[];
			economicGroups?: string[];
			businessStates?: string[];
			businessCities?: string[];
		},
	) {
		const qb = Bill.query()
			.preload("economicGroup")
			.preload("businessUnit")
			.preload("seller")
			.preload("client", (query) => {
				query.preload("tutor", (query) => {
					query.preload("clientOrigin");
					query.preload("profession");
				});
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.select("id", "description", "specie_id");
						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});
			})
			.whereNull("deleted_at")
			.whereHas("businessUnit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", authCtx.system.id);
				});
			});

		if (authCtx.user.type === "user") {
			qb.where("economic_group_id", authCtx.group.id);
		} else {
			if (
				data.economicGroups &&
				Array.isArray(data.economicGroups) &&
				data.economicGroups.length > 0
			) {
				qb.whereIn("economic_group_id", data.economicGroups);
			} else {
				qb.where("economic_group_id", authCtx.group.id);
			}
		}

		if (
			data.businessUnits &&
			Array.isArray(data.businessUnits) &&
			data.businessUnits.length > 0
		) {
			qb.where("business_unit_id", data.businessUnits);
		}

		const withBusinessStates =
			data.businessStates &&
			Array.isArray(data.businessStates) &&
			data.businessStates.length > 0;
		const withBusinessCities =
			data.businessCities &&
			Array.isArray(data.businessCities) &&
			data.businessCities.length > 0;
		if (withBusinessStates || withBusinessCities) {
			qb.whereHas("businessUnit", (query) => {
				if (withBusinessStates) {
					query.whereIn("state", data.businessStates ?? []);
				}

				if (withBusinessCities) {
					query.whereIn("city", data.businessCities ?? []);
				}
			});
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw("bill_date::date between ? and ?", [
				DateTime.fromISO(data.fromDate).toFormat("yyyy-MM-dd"),
				DateTime.fromISO(data.toDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.status) {
			qb.where("status", data.status);
		}

		if (data.client) {
			qb.where("client_id", data.client);
		}

		if (data.patient) {
			qb.where("patient_id", data.patient);
		}

		const result = await qb;

		const metaResult: {
			usuario_agenda_origem_venda: string | null;
			data_venda_anterior: string | null;
			id: string;
		}[] = await Database.from("bills")
			.select(
				Database.raw(`(select users.name
        from users
                 join schedules on users.id = schedules.creation_user_id
                 join schedules_movements sm on schedules.id = sm.schedule_id and sm.movement_id = bills.id and
                                                sm.type = 'bill' limit 1)    as usuario_agenda_origem_venda,
       (select max(UltimaVenda.bill_date)
        from bills UltimaVenda
        where UltimaVenda.client_id = bills.client_id
          and UltimaVenda.bill_date < bills.bill_date
          and UltimaVenda.business_unit_id = bills.business_unit_id) as data_venda_anterior,
       bills.id`),
			)
			.joinRaw(
				"join business_units on business_units.id = bills.business_unit_id",
			)
			.joinRaw(
				"join economic_groups on economic_groups.id = business_units.economic_group_id and economic_groups.system_id = ?",
				[authCtx.system.id],
			)
			.whereRaw("bills.deleted_at is null")
			.whereRaw("bills.economic_group_id = ?", [authCtx.group.id])
			.whereRaw("bill_date::date between ? and ?", [
				data.fromDate ?? "",
				data.toDate ?? "",
			]);

		return result
			.map((elem) => ({
				id: elem.id,
				tag: elem.tag,
				billDate: elem.billDate,
				productValue: elem.productValue,
				serviceValue: elem.serviceValue,
				discountValue: elem.discountValue,
				totalValue: elem.totalValue,
				paidValue: elem.paidValue,
				missingPaymentValue: elem.totalValue - elem.paidValue,
				status: elem.status,

				originUser:
					metaResult.find((mr) => mr.id === elem.id)
						?.usuario_agenda_origem_venda ?? null,
				pastSaleDate:
					metaResult.find((mr) => mr.id === elem.id)?.data_venda_anterior ??
					null,

				group: {
					id: elem.economicGroup.id,
					name: elem.economicGroup.companyName,
				},
				unit: {
					id: elem.businessUnit.id,
					identification: elem.businessUnit.identification ?? "-",
					city: elem.businessUnit.city,
					state: elem.businessUnit.state,
				},
				seller: this.sharedService.captureGroup(elem.seller, (v) => ({
					id: v.id,
					name: v.name,
				})),
				client: this.sharedService.captureGroup(elem.client, (v) => ({
					id: v.id,
					name: v.name,
					tag: v.tag,
					cellphone: v.tutor?.cellphone ?? null,
					origin: v.tutor?.clientOrigin?.description ?? null,
					document: v.tutor?.document ?? null,
					profession: v.tutor?.profession?.description ?? null,
					postalCode: v.tutor?.postalCode ?? null,
					street: v.tutor?.street ?? null,
					number: v.tutor?.number ?? null,
					complement: v.tutor?.complement ?? null,
					district: v.tutor?.district ?? null,
					city: v.tutor?.city ?? null,
					state: v.tutor?.state ?? null,
					createdAt: v.createdAt,
				})),
				patient: this.sharedService.captureGroup(elem.patient, (v) => ({
					id: v.id,
					name: v.name,
					tag: v.tag,
					birthDate: v.birthDate,
					race: v.patientAnimal?.race ?? null,
					gender: v.gender ?? null,
					castrated: v?.patientAnimal?.castrated ?? null,
					weight: v?.weight ?? null,
					vaccineOrigin: v?.vaccineOrigin ?? null,
					death: v?.patientAnimal?.death ?? null,
					deathDate: v?.patientAnimal?.deathDate ?? null,
					createdAt: v.createdAt,
				})),
			}))
			.sort((a, b) => {
				if (a.group.name.localeCompare(b.group.name) !== 0) {
					return a.group.name.localeCompare(b.group.name);
				}

				if (a.unit.identification.localeCompare(b.unit.identification) !== 0) {
					return a.unit.identification.localeCompare(b.unit.identification);
				}

				return (
					a.billDate.toJSDate().getTime() - b.billDate.toJSDate().getTime()
				);
			});
	}

	async detailedSalesReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			status?: string;
			client?: string;
			patient?: string;
			businessUnit?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(`
        systems.name                                                            as Sistema,
       economic_groups.company_name                                            as Grupo,
       business_units.city                                                     as Cidade,
       business_units.state                                                    as UF,
       bills.bill_date::Date                                                   as data_Venda,
       bills.bill_date::time                                                   as hora_Venda,
       bills.tag                                                               as Codigo_Venda,
       users."name"                                                            as vendedor,
       bills.service_value                                                     as total_Servicos_Venda,
       bills.product_value                                                     as Total_Produtos_Venda,
       bills.discount_value                                                    as total_Desconto_Venda,
       bills.total_value                                                       as Total_Venda,
       bills.paid_value                                                        as Total_Pago_Venda,
       (bills.total_value - bills.paid_value)                                  as Total_Em_Aberto_Venda,
       CliTu.created_at::date                                                  as data_Cadastro_Cliente,
       Cli."name"                                                              as nomeCliente,
       CliTu.document                                                          as cpfCnpj,
       CliTu.cellphone,
       client_origins.description                                              as Origem_Cliente,
       professions.description                                                 as profissao_Cliente,
       CliTu.postal_code                                                       as cep_Cliente,
       CliTu.street                                                            as endereço_Cliente,
       CliTu.number                                                            as numero_Endereco_Cliente,
       CliTu.complement                                                        as complemento_Endereco_Cliente,
       CliTu.district                                                          as bairro_Cliente,
       CliTu.city                                                              as cidade_Cliente,
       CliTu.state                                                             as uf_Cliente,
       Dep."name"                                                              as Dependente,
       Dep.tag                                                                 as dependente_RG,
       Dep.birth_date                                                          as data_Nasc_Dep,
       Dep.gender                                                              as genero_Dep,
       species.description                                                     as especie_Dep,
       races.description                                                       as raca_Dep,
       case when CliDep.castrated = true then 'Sim' else 'Não' end             as castrado_Dep,
       Cli.vaccine_origin                                                      as vacinado_Dep,
       Dep.weight,
       case when CliDep.death = true then 'Sim' else 'Não' end                 as obito_Dep,
       case when CliDep.death = true then CliDep.death_date else null end      as data_Obito_Dep,
       case when products."type" = 'product' then 'Produto' else 'Serviço' end as tipo_Item,
       subgroups.description                                                   as subGrupo_Item,
       products.description                                                    as descricao_Item,
       bill_items.quantity                                                     as qtd_Item,
       bill_items.unitary_value                                                as valor_Unitario_Item,
       (bill_items.quantity * bill_items.unitary_value)                        as valor_Bruto_Item,
       bill_items.discount_value                                               as valor_Desconto_Item,
       bill_items.total_value                                                  as valor_Liquido_Item,
       avaliador.name as avaliador,
	    (select a.created_at::date
				from attendances a
					join schedule_service_types sst on a.schedule_service_id = sst.id and sst."type" = 'A'
				where a.deleted_at is null
				and a.business_unit_id = business_units.id and a.patient_id = cli.id
				order by a.created_at desc limit 1
		  ) as ultima_avaliacao,

      (select users.name
        from users
                 join schedules on users.id = schedules.creation_user_id
                 join schedules_movements sm on schedules.id = sm.schedule_id and sm.movement_id = bills.id and
                                                sm.type = 'bill' limit 1)              as usuario_agenda_origem_venda,
       (select max(UltimaVenda.bill_date)
        from bills UltimaVenda
        where UltimaVenda.client_id = bills.client_id
          and UltimaVenda.bill_date < bills.bill_date
          and UltimaVenda.business_unit_id = bills.business_unit_id)           as data_venda_anterior
        `),
			)
			.joinRaw(
				`join bill_items on bills.id = bill_items.bill_id AND bill_items.status <> 'INATIVA'`,
			)
			.joinRaw(
				`join product_variations on bill_items.product_variation_id = product_variations.id`,
			)
			.joinRaw(
				`join (products join subgroups on products.subgroup_id = subgroups.id)
        on product_variations.product_id = products.id`,
			)
			.joinRaw(
				`JOIN business_units ON bills.business_unit_id = business_units."id"`,
			)
			.joinRaw(
				`JOIN economic_groups ON business_units.economic_group_id = economic_groups."id" and economic_groups.system_id = ?`,
				[authCtx.system.id],
			)
			.joinRaw(`JOIN systems ON economic_groups.system_id = systems."id"`)
			.joinRaw(`JOIN patients Cli ON bills.client_id = Cli."id"`)
			.joinRaw(
				`JOIN (patient_tutors CliTu left join professions on CliTu.profession_id = professions.id)
        ON Cli."id" = CliTu.patient_id`,
			)
			.joinRaw(
				`LEFT JOIN (patients Dep JOIN (patient_animals CliDep join races on cliDep.race_id = races.id join species
          on races.specie_id = species.id) ON Dep."id" = CliDep.patient_id)
ON bills.patient_id = Dep."id"`,
			)
			.joinRaw(
				`LEFT JOIN client_origins ON CliTu.client_origin_id = client_origins."id"`,
			)
			.joinRaw(`join users on bills.seller_id = users.id`)
			.joinRaw(
				"left join (budgets join users avaliador on budgets.reviewer_id = avaliador.id ) on bills.budget_id = budgets.id",
			)
			.whereNull("bills.deleted_at")
			.whereNull("bill_items.deleted_at")
			.orderByRaw('Cli."name", Dep.tag, bills.bill_date');

		if (data.fromDate) {
			qb.whereRaw("bills.bill_date::date >= ?", [
				DateTime.fromISO(data.fromDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toDate) {
			qb.whereRaw("bills.bill_date::date <= ?", [
				DateTime.fromISO(data.toDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.status) {
			qb.where("bills.status", data.status);
		}

		if (data.client) {
			qb.where("bills.client_id", data.client);
		}

		if (data.patient) {
			qb.where("bills.patient_id", data.patient);
		}

		if (data.businessUnit) {
			qb.where("bills.business_unit_id", data.businessUnit);
		}

		if (authCtx.user.type === "user") {
			qb.where("bills.economic_group_id", authCtx.group.id);
		}

		return qb;
	}

	async saleAnalyticsReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			status?: string[];
			client?: string[];
			patient?: string[];
			businessUnits?: string[];
			economicGroups?: string[];
			businessStates?: string[];
			businessCities?: string[];
		},
	) {
		const qb = Bill.query()
			.preload("economicGroup")
			.preload("businessUnit")
			.preload("seller")
			.preload("client", (query) => {
				query.preload("tutor", (query) => {
					query.preload("profession");
					query.preload("clientOrigin");
				});
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.preload("specie");
					});
				});
			})
			.preload("items", (query) => {
				query.preload("productVariation", (query) => {
					query.preload("product", (query) => {
						query.preload("subgroup");
					});
				});
			})
			.preload("budget")
			.preload("payments", (query) => {
				query.preload("flag").preload("paymentMethod");
			})
			.where("economic_group_id", authCtx.group.id)
			.whereNull("deleted_at")
			.whereHas("businessUnit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", authCtx.system.id);
				});
			})
			.orderBy("bill_date", "desc");

		if (authCtx.user.type === "user") {
			qb.where("economic_group_id", authCtx.group.id);
		} else {
			if (
				data.economicGroups &&
				Array.isArray(data.economicGroups) &&
				data.economicGroups.length > 0
			) {
				qb.whereIn("economic_group_id", data.economicGroups);
			} else {
				qb.where("economic_group_id", authCtx.group.id);
			}
		}

		if (
			data.businessUnits &&
			Array.isArray(data.businessUnits) &&
			data.businessUnits.length > 0
		) {
			qb.whereIn("business_unit_id", data.businessUnits);
		}

		const withBusinessStates =
			data.businessStates &&
			Array.isArray(data.businessStates) &&
			data.businessStates.length > 0;
		const withBusinessCities =
			data.businessCities &&
			Array.isArray(data.businessCities) &&
			data.businessCities.length > 0;
		if (withBusinessStates || withBusinessCities) {
			qb.whereHas("businessUnit", (query) => {
				if (withBusinessStates) {
					query.whereIn("state", data.businessStates ?? []);
				}

				if (withBusinessCities) {
					query.whereIn("city", data.businessCities ?? []);
				}
			});
		}
		if (data.fromDate) {
			qb.whereRaw("bill_date::date >= ?", [
				DateTime.fromISO(data.fromDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toDate) {
			qb.whereRaw("bill_date::date <= ?", [
				DateTime.fromISO(data.toDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.status && Array.isArray(data.status) && data.status.length > 0) {
			qb.whereIn("status", data.status);
		}

		if (data.client && Array.isArray(data.client) && data.client.length > 0) {
			qb.whereIn("client_id", data.client);
		}
		if (
			data.patient &&
			Array.isArray(data.patient) &&
			data.patient.length > 0
		) {
			qb.whereIn("patient_id", data.patient);
		}

		const result = await qb;

		return result
			.map((elem) => ({
				id: elem.id,
				tag: elem.tag,
				billDate: elem.billDate,
				productValue: elem.productValue,
				serviceValue: elem.serviceValue,
				discountValue: elem.discountValue,
				totalValue: elem.totalValue,
				paidValue: elem.paidValue,
				missingPaymentValue: elem.totalValue - elem.paidValue,
				status: elem.status,

				group: {
					id: elem.economicGroup.id,
					name: elem.economicGroup.companyName,
				},
				unit: {
					id: elem.businessUnit.id,
					identification: elem.businessUnit.identification ?? "-",
					city: elem.businessUnit.city,
					state: elem.businessUnit.state,
				},
				seller: this.sharedService.captureGroup(elem.seller, (v) => ({
					id: v.id,
					name: v.name,
				})),
				client: this.sharedService.captureGroup(elem.client, (v) => ({
					id: v.id,
					name: v.name,
					tag: v.tag,
					profession: v.tutor?.profession?.description ?? null,
					origin: v.tutor?.clientOrigin?.description ?? null,
					document: v.tutor?.document ?? null,
					cellphone: v.tutor?.cellphone ?? null,
					createdAt: v.createdAt,
					address: [
						v.tutor?.postalCode,
						v.tutor?.street,
						v.tutor?.number,
						v.tutor?.complement,
						v.tutor?.district,
						v.tutor?.city,
						v.tutor?.state,
					]
						.filter(Boolean)
						.join(", "),
				})),
				patient: this.sharedService.captureGroup(elem.patient, (v) => ({
					id: v.id,
					name: v.name,
					race: v.patientAnimal.race,
					tag: v.tag ?? null,
					gender: v.gender ?? null,
					castrated: v?.patientAnimal?.castrated ?? null,
				})),
				budget: this.sharedService.captureGroup(elem.budget, (v) => ({
					id: v.id,
					tag: v.tag,
					budgetDate: v.budgetDate,
				})),
				payments: elem.payments.map((inner) => ({
					id: inner.id,
					block: inner.block,
					qtyInstallments: inner.qtyInstallments,
					totalValue: inner.totalValue,
					installments: inner.installments,
					epxirationDate: inner.expirationDate,
					nsuDocument: inner.nsuDocument,

					paymentMethod: this.sharedService.captureGroup(
						inner.paymentMethod,
						(v) => ({
							id: v.id,
							description: v.description,
						}),
					),
					flag: this.sharedService.captureGroup(inner.flag, (v) => ({
						id: v.id,
						description: v.description,
					})),
				})),
				items: elem.items.map((inner) => ({
					id: inner.id,
					quantity: inner.quantity,
					costValue: inner.costValue,
					saleValue: inner.saleValue,
					discountValue: inner.discountValue,
					totalValue: inner.totalValue,
					product: {
						description: inner.productVariation?.product?.description ?? null,
						type: inner.productVariation?.product?.type ?? null,
						subgroup: this.sharedService.captureGroup(
							inner.productVariation?.product?.subgroup,
							(v) => ({ id: v.id, description: v.description }),
						),
					},
				})),
			}))
			.sort((a, b) => {
				if (a.group.name.localeCompare(b.group.name) !== 0) {
					return a.group.name.localeCompare(b.group.name);
				}

				if (a.unit.identification.localeCompare(b.unit.identification) !== 0) {
					return a.unit.identification.localeCompare(b.unit.identification);
				}

				return (
					a.billDate.toJSDate().getTime() - b.billDate.toJSDate().getTime()
				);
			});
	}

	async entriesReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			businessUnit?: string;
		},
	) {
		const qb = Finance.query()
			.preload("unit")
			.where("economic_group_id", authCtx.group.id);

		if (data.businessUnit) {
			qb.where("business_unit_id", data.businessUnit);
		}

		if (data.fromDate) {
			qb.whereRaw("expiration_date::date >= ?", [
				DateTime.fromISO(data.fromDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toDate) {
			qb.whereRaw("expiration_date::date <= ?", [
				DateTime.fromISO(data.toDate).toFormat("yyyy-MM-dd"),
			]);
		}

		const result = await qb;

		const unitsSet = new Set<string>(result.map((r) => r.unit.id));
		const uniqueUnitIds = Array.from(unitsSet);
		const units = uniqueUnitIds
			.map((elem) => result.find((r) => r.unit.id === elem)?.unit)
			.filter(Boolean) as BusinessUnit[];

		return units.map((elem) => ({
			id: elem.id,
			identification: elem.identification ?? "-",
			credits: result
				.filter(
					(r) => r.business_unit_id === elem.id && r.type === FinanceType.C,
				)
				.map((r) => r.totalValue)
				.reduce((a, b) => a + b, 0),
			debits: result
				.filter(
					(r) => r.business_unit_id === elem.id && r.type === FinanceType.D,
				)
				.map((r) => r.totalValue)
				.reduce((a, b) => a + b, 0),
		}));
	}

	async budgetsReport(
		authCtx: AuthContext,
		data: {
			fromBudgetDate?: string;
			toBudgetDate?: string;
			fromExpirationDate?: string;
			toExpirationDate?: string;
			fromFinishedDate?: string;
			toFinishedDate?: string;
			clientName?: string;
			patientName?: string;
			businessUnit?: string;
			status?: string;
		},
	) {
		const qb = Budget.query()
			.preload("unit")
			.preload("client", (query) => {
				query.preload("tutor", (query) => {
					query.preload("clientOrigin");
					query.preload("profession");
				});
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.select("id", "description", "specie_id");
						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});
			})
			.preload("user")
			.preload("seller")
			.preload("conclusionUser")
			.preload("cancelationReason")
			.where("economic_group_id", authCtx.group.id)
			.whereHas("unit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", authCtx.system.id);
				});
			})
			.whereNull("deleted_at");

		if (authCtx.user.type === "user") {
			qb.where("economic_group_id", authCtx.group.id);
		}

		if (data.businessUnit) {
			qb.where("business_unit_id", data.businessUnit);
		}

		if (data.patientName) {
			qb.andWhereHas("patient", (query) => {
				query.whereILike("name", `%${data.patientName!}%`);
			});
		}

		if (data.clientName) {
			qb.andWhereHas("client", (query) => {
				query.whereILike("name", `%${data.clientName!}%`);
			});
		}

		if (data.fromBudgetDate) {
			qb.whereRaw("budget_date::date >= ?", [
				DateTime.fromISO(data.fromBudgetDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toBudgetDate) {
			qb.whereRaw("budget_date::date <= ?", [
				DateTime.fromISO(data.toBudgetDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.fromExpirationDate) {
			qb.whereRaw("expiration_date::date >= ?", [
				DateTime.fromISO(data.fromExpirationDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toExpirationDate) {
			qb.whereRaw("expiration_date::date <= ?", [
				DateTime.fromISO(data.toExpirationDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.fromFinishedDate) {
			qb.whereRaw("finished_at::date >= ?", [
				DateTime.fromISO(data.fromFinishedDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toFinishedDate) {
			qb.whereRaw("finished_at::date <= ?", [
				DateTime.fromISO(data.toFinishedDate).toFormat("yyyy-MM-dd"),
			]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			clientName: elem.clientName ?? null,
			tag: elem.tag,
			budgetDate: elem.budgetDate,
			expirationDate: elem.expirationDate,
			finishedDate: elem.finishedAt,
			productValue: elem.productValue,
			serviceValue: elem.serviceValue,
			discountValue: elem.discountValue,
			totalValue: elem.totalValue,
			status: elem.status,
			observation: elem.observation,
			canceledObservation: elem.canceledObservation,
			unit: {
				id: elem.unit.id,
				identification: elem.unit.identification,
				city: elem.unit.city,
				state: elem.unit.state,
			},
			client: this.sharedService.captureGroup(elem.client, (v) => ({
				id: v.id,
				name: v.name,
				tag: v.tag,
				cellphone: v.tutor?.cellphone ?? null,
				origin: v.tutor?.clientOrigin?.description ?? null,
				document: v.tutor?.document ?? null,
				profession: v.tutor?.profession?.description ?? null,
				postalCode: v.tutor?.postalCode ?? null,
				street: v.tutor?.street ?? null,
				number: v.tutor?.number ?? null,
				complement: v.tutor?.complement ?? null,
				district: v.tutor?.district ?? null,
				city: v.tutor?.city ?? null,
				state: v.tutor?.state ?? null,
				createdAt: v.createdAt,
			})),
			patient: this.sharedService.captureGroup(elem.patient, (v) => ({
				id: v.id,
				name: v.name,
				tag: v.tag,
				birthDate: v.birthDate,
				race: v.patientAnimal?.race ?? null,
				gender: v.gender ?? null,
				castrated: v?.patientAnimal?.castrated ?? null,
				weight: v?.weight ?? null,
				vaccineOrigin: v?.vaccineOrigin ?? null,
				death: v?.patientAnimal?.death ?? null,
				deathDate: v?.patientAnimal?.deathDate ?? null,
				createdAt: v.createdAt,
			})),
			seller: this.sharedService.captureGroup(elem.seller, (v) => ({
				id: v.id,
				name: v.name,
			})),
			conclusionUser: this.sharedService.captureGroup(
				elem.conclusionUser,
				(v) => ({
					id: v.id,
					name: v.name,
				}),
			),
			reason: this.sharedService.captureGroup(elem.cancelationReason, (v) => ({
				id: v.id,
				description: v.reason,
			})),
		}));
	}

	async schedulingReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			status?: string;
			service?: string;
			holder?: string;
			patient?: string;
			businessUnits?: string[];
			economicGroups?: string[];
			businessStates?: string[];
			businessCities?: string[];
		},
	) {
		const qb = Database.from("schedules")
			.select(
				Database.raw(`
        business_units.identification,
        business_units.city as unit_city,
        business_units.state as unit_state,
        uResponsavel.name                                                        as nome_Responsavel,
        to_char(start_hour, 'DD/MM/YYYY')                                        as start_hour_date,
        to_char(start_hour, 'HH24:MI')                                           as start_hour_time,
        to_char(end_hour, 'DD/MM/YYYY')                                          as end_hour_date,
        to_char(end_hour, 'HH24:MI')                                             as end_hour_time,
        schedule_service_types.reserved_minutes,
        schedules.started_at,
        schedules.finished_at,
        extract(epoch from (schedules.finished_at - schedules.started_at)) / 60  as minutos_Duracao_Atendimento,
        schedule_statuses.description                                            as status,
        schedule_service_types.description,
        case
           when schedule_service_types.type = 'A' then 'Agendamento'
           when schedule_service_types.type = 'P' then 'Procedimento'
           when schedule_service_types.type = 'R' then 'Retorno'
           end                                                                  as tipo_Agendamento,
        ucanc.name                                                               as usuario_Cancelamento,
        reasons.reason                                                           as motivo_Cancelamento,
        case
           when schedules.cancellation_user_id is not null then schedules.updated_at
           end                                                                  as data_Cancelamento,
        case when schedules.schedule_return_id is null then 'Nao' else 'Sim' end as tem_Retorno,
        case when schedules.schedule_origin_id is null then 'Nao' else 'Sim' end as e_Retorno,
        tutor.created_at                                                         as dataC_adastro_Tutor,
        tutor.name                                                               as nome_Tutor,
        patient_tutors.document                                                  as cpf_Cnpj_Tutor,
        patient_tutors.cellphone,
        patient_tutors.postal_code,
        patient_tutors.street,
        patient_tutors.number,
        patient_tutors.complement,
        patient_tutors.district,
        patient_tutors.city,
        patient_tutors.state,
        professions.description                                                         as profissao_Tutor,
        client_origins.description                                                           as origem_Tutor,
        pac.name                                                                 as nome_Paciente,
        pac.tag                                                                  as rg_Paciente,
        pac.birth_date                                                           as nasc_Paciente,
        pac.gender                                                               as genero_Paciente,
        species.description                                                      as especie_Paciente,
        races.description                                                        as raca_Paciente,
        case when pa.castrated then 'Sim' else 'Não' end                         as castrado_Paciente,
        pac.weight                                                               as peso_Paciente,
        pac.vaccine_origin                                                       as vacinado,
        case when pa.death then 'Sim' else 'Não' end                             as obito_Paciente,
        case when pa.death then pa.death_date end                                as data_Obito_Paciente
    `),
			)
			.joinRaw(
				`join business_units on schedules.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id and economic_groups.system_id = ?`,
				[authCtx.system.id],
			)
			.joinRaw(
				`join schedule_service_types on schedules.schedule_service_type_id = schedule_service_types.id`,
			)
			.joinRaw(
				`join schedule_statuses on schedules.schedule_status_id = schedule_statuses.id`,
			)
			.joinRaw(`join users uResponsavel on schedules.user_id = uResponsavel.id`)

			.joinRaw(
				`left join users uCanc on schedules.cancellation_user_id = ucanc.id`,
			)

			.joinRaw(`left join reasons on schedules.reason_id = reasons.id`);

		if (authCtx.unit.unitConfig.requiresScheduleTutor) {
			qb.joinRaw(`join (patients tutor join
    ((patient_tutors left join professions on patient_tutors.profession_id = professions.id) left join client_origins
     on patient_tutors.client_origin_id = client_origins.id)
               on tutor.id = patient_tutors.patient_id) on schedules.holder_id = tutor.id
               `);
			qb.joinRaw(`
         join (patients pac join
    (patient_animals pa join (races join species on races.specie_id = species.id) on pa.race_id = races.id)
               on pac.id = pa.patient_id
    ) on schedules.patient_id = pac.id`);
		} else {
			qb.joinRaw(`join (patients tutor join
    ((patient_tutors left join professions on patient_tutors.profession_id = professions.id) left join client_origins
     on patient_tutors.client_origin_id = client_origins.id)
               on tutor.id = patient_tutors.patient_id) on schedules.patient_id = tutor.id`);
			qb.joinRaw(`left join (patients pac join
    (patient_animals pa join (races join species on races.specie_id = species.id) on pa.race_id = races.id)
               on pac.id = pa.patient_id
    ) on schedules.patient_id = pac.id`);
		}

		if (authCtx.user.type === "user") {
			qb.where("business_units.economic_group_id", authCtx.group.id);
		} else {
			if (
				data.economicGroups &&
				Array.isArray(data.economicGroups) &&
				data.economicGroups.length > 0
			) {
				qb.whereIn("business_units.economic_group_id", data.economicGroups);
			} else {
				qb.where("business_units.economic_group_id", authCtx.group.id);
			}
		}

		if (
			data.businessUnits &&
			Array.isArray(data.businessUnits) &&
			data.businessUnits.length > 0
		) {
			qb.whereIn("business_units.id", data.businessUnits);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		const withBusinessStates =
			data.businessStates &&
			Array.isArray(data.businessStates) &&
			data.businessStates.length > 0;
		const withBusinessCities =
			data.businessCities &&
			Array.isArray(data.businessCities) &&
			data.businessCities.length > 0;

		if (withBusinessStates) {
			qb.whereIn("business_units.state", data.businessStates ?? []);
		}
		if (withBusinessCities) {
			qb.whereIn("business_units.city", data.businessCities ?? []);
		}

		if (data.fromDate) {
			qb.whereRaw("start_hour::date >= ?", [
				DateTime.fromISO(data.fromDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toDate) {
			qb.whereRaw("start_hour::date <= ?", [
				DateTime.fromISO(data.toDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.status) {
			qb.where("schedules.schedule_status_id", data.status);
		}

		if (data.service) {
			qb.where("schedules.schedule_service_type_id", data.service);
		}

		if (data.holder) {
			qb.where("schedules.holder_id", data.holder);
		}

		if (data.patient) {
			qb.where("schedules.patient_id", data.patient);
		}

		return await qb;
	}

	async productTypeReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			status?: string;
			type?: string;
			holder?: string;
			patient?: string;
			businessUnits?: string[];
			economicGroups?: string[];
			businessStates?: string[];
			businessCities?: string[];
		},
	) {
		const qb1 = Database.from("bills")
			.select(Database.raw("sum(bill_items.total_value) as total_sales"))
			.joinRaw(
				`join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on bills.economic_group_id = economic_groups.id and economic_groups.system_id = ?`,
				[authCtx.system.id],
			)
			.joinRaw(
				`join bill_items on bills.id = bill_items.bill_id and bill_items.status = 'ATIVA'`,
			)
			.joinRaw(
				`join product_variations on bill_items.product_variation_id = product_variations.id`,
			)
			.joinRaw(`join products on product_variations.product_id = products.id`)
			.whereNull("bills.deleted_at")
			.whereNot("bills.status", BillStatus.EX);

		const qb2 = Database.from("bills")
			.select(
				Database.raw(
					`
            economic_groups.id as e_id,
            economic_groups.company_name,
            business_units.id as b_id,
            business_units.identification,
            business_units.city,
            business_units.state,
            products.description,
            products.type,
            sum(bill_items.quantity)         as quantity,
            count(distinct bills.id)         as sales,
            count(distinct bills.client_id)  as clients,
            count(distinct bills.patient_id) as patients,
            sum(bill_items.total_value)      as total_value
          `,
				),
			)
			.groupBy(
				"economic_groups.id",
				"business_units.id",
				"products.id",
				"products.description",
			)
			.joinRaw(
				`join economic_groups on bills.economic_group_id = economic_groups.id and economic_groups.system_id = ?`,
				[authCtx.system.id],
			)
			.joinRaw(
				`join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join bill_items on bills.id = bill_items.bill_id and bill_items.status = 'ATIVA'`,
			)
			.joinRaw(
				`join product_variations on bill_items.product_variation_id = product_variations.id`,
			)
			.joinRaw(`join products on product_variations.product_id = products.id`)
			.orderByRaw(`sum(bill_items.total_value) desc, products.description`)
			.whereNull("bills.deleted_at")
			.whereNot("bills.status", BillStatus.EX);

		if (data.type) {
			qb1.andWhere("products.type", data.type);
			qb2.andWhere("products.type", data.type);
		}

		if (data.fromDate) {
			qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
			qb2.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
			qb2.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		if (data.status) {
			qb1.andWhere("bills.status", data.status);
			qb2.andWhere("bills.status", data.status);
		}

		if (data.holder) {
			qb1.andWhere("bills.client_id", data.holder);
			qb2.andWhere("bills.client_id", data.holder);
		}

		if (data.patient) {
			qb1.andWhere("bills.patient_id", data.patient);
			qb2.andWhere("bills.patient_id", data.patient);
		}

		if (data.businessUnits && Array.isArray(data.businessUnits)) {
			qb1.andWhereIn("bills.business_unit_id", data.businessUnits);
			qb2.andWhereIn("bills.business_unit_id", data.businessUnits);
		} else {
			qb1.andWhereIn("bills.business_unit_id", [authCtx.unit.id]);
			qb2.andWhereIn("bills.business_unit_id", [authCtx.unit.id]);
		}

		if (authCtx.user.type === "user") {
			qb1.andWhereIn("bills.economic_group_id", [authCtx.group.id]);
			qb2.andWhereIn("bills.economic_group_id", [authCtx.group.id]);
		} else {
			if (data.economicGroups && Array.isArray(data.economicGroups)) {
				qb1.andWhereIn("bills.economic_group_id", data.economicGroups);
				qb2.andWhereIn("bills.economic_group_id", data.economicGroups);
			} else {
				qb1.andWhereIn("bills.economic_group_id", [authCtx.group.id]);
				qb2.andWhereIn("bills.economic_group_id", [authCtx.group.id]);
			}
		}

		if (data.businessStates && Array.isArray(data.businessStates)) {
			qb1.andWhereIn("business_units.state", data.businessStates);
			qb2.andWhereIn("business_units.state", data.businessStates);
		}

		if (data.businessCities && Array.isArray(data.businessCities)) {
			qb1.andWhereIn("business_units.city", data.businessCities);
			qb2.andWhereIn("business_units.city", data.businessCities);
		}

		const [{ total_sales = "0" }] = await qb1;
		const parsedTotal = Number.parseFloat(total_sales);

		const result = await qb2;

		return result.map((elem) => ({
			group: {
				id: elem.e_id,
				name: elem.company_name,
			},
			unit: {
				id: elem.b_id,
				identification: elem.identification,
				city: elem.city,
				state: elem.state,
			},
			product: {
				description: elem.description,
				type: elem.type,
			},
			quantity: elem.quantity,
			sales: Number.parseInt(elem.sales, 10),
			clients: Number.parseInt(elem.clients, 10),
			patients: Number.parseInt(elem.patients, 10),
			totalValue: elem.total_value,
			percentage: (elem.total_value / parsedTotal) * 100,
		}));
	}

	async competenceReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			businessUnits?: string[];
		},
	) {
		const qb = Database.from("finances")
			.select(
				Database.raw(`finances.issue_date::date                                                     data_emissao,
        case when pc.parent_id is null then pc.description else pcPai.description end Plano_Contas_Grupo,
        pc.description                                                                Plano_Contas,
        finances.historic                                                             historico,
        p."name"                                                                      Pessoa,
        TO_CHAR(finances.total_value, '9999990D99')                                   valor_Titulo`),
			)
			.joinRaw(
				`left join (account_plans pc left join account_plan_groups gpc on pc.account_plan_group_id = gpc.id
    left join account_plans pcPai on pc.parent_id = pcPai.id) on finances.account_plan_id = pc."id"`,
			)
			.joinRaw(`join patients p on finances.client_id = p."id"`)
			.joinRaw(`join economic_groups eg on finances.economic_group_id = eg.id`)
			.joinRaw(`join systems sys on eg.system_id = sys.id`)
			.joinRaw(`join business_units bu on finances.business_unit_id = bu.id`)
			.orderByRaw(
				`finances."type", finances.issue_date, finances."document", finances.installment`,
			)
			.whereNull("finances.deleted_at")
			.where("finances.type", FinanceType.D);

		if (
			data.businessUnits &&
			Array.isArray(data.businessUnits) &&
			data.businessUnits.length > 0
		) {
			qb.whereIn("finances.business_unit_id", data.businessUnits);
		} else {
			qb.where("finances.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw(
				"to_char((substring(finances.competence_date,4,4) ||'-'|| substring(finances.competence_date,1,2) ||'-01')::date , 'YYYYMM' ) between ? and ?",
				[data.fromDate, data.toDate],
			);
		}

		return await qb;
	}

	async planGroupReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			businessUnits?: string[];
		},
	) {
		const qb = Database.from("finances")
			.select(
				Database.raw(`finances.competence_date                                                                          Competencia,
       finances.payment_date::date                                                                       data_Pagamento,
       case when pc.parent_id is null then pc.description else pcPai.description end              Plano_Contas_Grupo,
       pc.description                                                                             Plano_Contas,
       concat(trim(TO_CHAR(finances.installment, '999')), '/', trim(TO_CHAR(finances.qty_installments, '999'))) parcela,
       finances.historic                                                                                 historico,
       p."name"                                                                                   Pessoa,
      TO_CHAR(case when finances.payment_value is null then finances.total_value else finances.payment_value end, '9999990D99') valor_Pago,
       case when finances.payment_date is null then 'Aberto' else 'Baixado' end status`),
			)
			.joinRaw(
				`left join (account_plans pc left join account_plan_groups gpc on pc.account_plan_group_id = gpc.id
    left join account_plans pcPai on pc.parent_id = pcPai.id) on finances.account_plan_id = pc."id"`,
			)
			.joinRaw(`join patients p on finances.client_id = p."id"`)
			.joinRaw(`join economic_groups eg on finances.economic_group_id = eg.id`)
			.joinRaw(`join systems sys on eg.system_id = sys.id`)
			.joinRaw(`join business_units bu on finances.business_unit_id = bu.id`)
			.orderByRaw(
				`finances."type", finances.issue_date, finances."document", finances.installment`,
			)
			.whereNull("finances.deleted_at")
			.where("finances.type", FinanceType.D);

		if (
			data.businessUnits &&
			Array.isArray(data.businessUnits) &&
			data.businessUnits.length > 0
		) {
			qb.whereIn("finances.business_unit_id", data.businessUnits);
		} else {
			qb.where("finances.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw(
				"(((finances.payment_date::date) BETWEEN ? and ?) or (finances.payment_date is null and finances.expiration_date::date BETWEEN ? and ?))",
				[data.fromDate, data.toDate, data.fromDate, data.toDate],
			);
		}

		return await qb;
	}

	async buySuggestionReport(
		authCtx: AuthContext,
		data: {
			businessUnits?: string[];
		},
	) {
		const qb = Database.from("deposits")
			.select(
				Database.raw(`
             business_units.id,
       business_units.identification,
       products.id                 as product_id,
       deposit_items.product_variation_id,
       products.description,
       sum(deposit_items.quantity) as qtdEstoque,
       business_unit_products.minimum_stock,
       business_unit_products.maximum_stock,
       case
           when sum(deposit_items.quantity) <= business_unit_products.minimum_stock
               then business_unit_products.maximum_stock - sum(deposit_items.quantity)
           else 0 end              as sugestaoCompra
                     `),
			)
			.joinRaw(`join deposit_items on deposits.id = deposit_items.deposit_id`)
			.joinRaw(
				`join product_variations on product_variations.id = deposit_items.product_variation_id`,
			)
			.joinRaw(`join products on products.id = product_variations.product_id`)
			.joinRaw(`join business_unit_products
              on business_unit_products.id = deposit_items.business_unit_product_id and
                 business_unit_products.product_variation_id = product_variations.id and
                 business_unit_products.businness_unit_id = deposits.business_unit_id`)
			.joinRaw(
				`join business_units on deposits.business_unit_id = business_units.id`,
			)
			.where("deposits.economic_group_id", authCtx.group.id)
			.where("deposits.type", "Venda")
			.where("deposits.status", "Ativo")
			.where("deposit_items.status", "Ativo")
			.groupByRaw(`business_units.id, business_units.identification, products.id, deposit_items.product_variation_id,
         products.description,
         business_unit_products.minimum_stock, business_unit_products.maximum_stock`)
			.havingRaw(
				"sum(deposit_items.quantity) <= business_unit_products.minimum_stock",
			);

		if (
			data.businessUnits &&
			Array.isArray(data.businessUnits) &&
			data.businessUnits.length > 0
		) {
			qb.whereIn("deposits.business_unit_id", data.businessUnits);
		}

		const result = await qb;

		const reducedKeys = result.reduce((acc, curr) => {
			if (!acc.includes(curr.id)) {
				acc.push(curr.id);
			}

			return acc;
		}, [] as string[]);

		return reducedKeys.map((elem) => {
			return {
				id: elem,
				identification:
					result.find((r) => r.id === elem)?.identification ?? "Erro",
				products: result
					.filter((r) => r.id === elem)
					.map((p) => ({
						id: p.product_id,
						variationId: p.product_variation_id,
						description: p.description,
						qtyStock: parseFloat(p.qtdestoque),
						minimumStock: parseFloat(p.minimum_stock),
						maximumStock: parseFloat(p.maximum_stock),
						suggestion: parseFloat(p.sugestaocompra),
					})),
			};
		});
	}

	async issuedNfeReport(
		authCtx: AuthContext,
		data: {
			businessUnit?: string;
			fromDate?: string;
			toDate?: string;
			statuses?: string[];
		},
	) {
		if (!authCtx.hasPermission("REL17")) {
			throw new UnauthorizedException(
				"Sem permissão para ver o relatório",
				400,
				"E_ERR",
			);
		}

		if (!data.businessUnit) {
			throw new BadRequestException("Unidade não informada", 400, "E_ERR");
		}

		if (!data.fromDate && !data.toDate) {
			throw new BadRequestException("Datas não informadas", 400, "E_ERR");
		}

		const qb = Database.from("bills")
			.select(
				Database.raw(`
       patients.name as client_name,
       bills.tag,
       movement_type,
       purpose,
       issued_fiscal_documents.model,
       issued_fiscal_documents.series,
       substring(issued_fiscal_documents.access_key, 29, 9) numero_nota,
       bills.product_value,
       issued_fiscal_documents.access_key,
       issued_fiscal_documents.authorization_date,
       issued_fiscal_documents.authorization_receipt_date,
       issued_fiscal_documents.authorization_receipt,
       issued_fiscal_documents.cancellation_receipt_date,
       issued_fiscal_documents.cancellation_receipt,
       issued_fiscal_documents.disabling_receipt_date,
       issued_fiscal_documents.disabling_receipt,
       issued_fiscal_documents.disabling_reason,
       issued_fiscal_documents.sefaz_status,
       issued_fiscal_documents.sefaz_message
       `),
			)
			.joinRaw(
				"join issued_fiscal_documents on bills.id = issued_fiscal_documents.bill_id",
			)
			.joinRaw("join patients on bills.client_id = patients.id")
			.where("bills.economic_group_id", authCtx.group.id)
			.where("bills.business_unit_id", authCtx.unit.id)
			.whereNull("issued_fiscal_documents.deleted_at")
			.whereRaw(
				"issued_fiscal_documents.authorization_date::date between ?::date and ?::date",
				[data.fromDate!, data.toDate!],
			)
			.orderByRaw("substring(issued_fiscal_documents.access_key, 29, 9)");

		if (data.statuses && Array.isArray(data.statuses)) {
			const withSemRetorno = data.statuses.includes("sem_retorno");
			if (withSemRetorno) {
				const clearStatuses = data.statuses.filter((f) => f !== "sem_retorno");
				if (clearStatuses.length === 0) {
					qb.whereRaw(
						"(issued_fiscal_documents.sefaz_status = '' or issued_fiscal_documents.sefaz_status is null)",
					);
				} else {
					qb.whereRaw(
						"(issued_fiscal_documents.sefaz_status = '' or issued_fiscal_documents.sefaz_status is null or issued_fiscal_documents.sefaz_status ~* ?)",
						[clearStatuses.join("|")],
					);
				}
			} else {
				qb.whereRaw("issued_fiscal_documents.sefaz_status ~* ?", [
					data.statuses.join("|"),
				]);
			}
		}

		return qb;
	}

	async issuedNfseReport(
		authCtx: AuthContext,
		data: {
			businessUnit?: string;
			fromDate?: string;
			toDate?: string;
			statuses?: string[];
		},
	) {
		if (!data.businessUnit) {
			throw new BadRequestException("Unidade não informada", 400, "E_ERR");
		}

		if (!data.fromDate && !data.toDate) {
			throw new BadRequestException("Datas não informadas", 400, "E_ERR");
		}

		const qb = Database.from("bills")
			.select(
				Database.raw(`
        bills.tag,
       service_issued_fiscal_documents.model,
       service_issued_fiscal_documents.sequence,
       service_issued_fiscal_documents.rps_number,
       service_issued_fiscal_documents.rps_series,
       service_issued_fiscal_documents.rps_type,
       verification_code,
       service_issued_fiscal_documents.errors,
       service_issued_fiscal_documents.authorization_date,
       service_issued_fiscal_documents.authorization_receipt,
       service_issued_fiscal_documents.cancellation_date,
       service_issued_fiscal_documents.cancellation_receipt_date,
       service_issued_fiscal_documents.cancellation_reason,
       service_issued_fiscal_documents.status
       `),
			)
			.joinRaw(
				`join service_issued_fiscal_documents on bills.id = service_issued_fiscal_documents.bill_id`,
			)
			.where("bills.economic_group_id", authCtx.group.id)
			.where("bills.business_unit_id", authCtx.unit.id)
			.whereNull("service_issued_fiscal_documents.deleted_at")
			.whereNotNull("service_issued_fiscal_documents.status")
			.whereRaw(
				"service_issued_fiscal_documents.authorization_date::date between ?::date and ?::date",
				[data.fromDate!, data.toDate!],
			)
			.orderBy("service_issued_fiscal_documents.sequence");

		if (data.statuses && Array.isArray(data.statuses)) {
			const withSemRetorno = data.statuses.includes("sem_retorno");
			if (withSemRetorno) {
				const clearStatuses = data.statuses.filter((f) => f !== "sem_retorno");
				if (clearStatuses.length === 0) {
					qb.whereRaw(
						"(service_issued_fiscal_documents.status = '' or service_issued_fiscal_documents.status is null)",
					);
				} else {
					qb.whereRaw(
						"(service_issued_fiscal_documents.status = '' or service_issued_fiscal_documents.status is null or service_issued_fiscal_documents.status ~* ?)",
						[clearStatuses.join("|")],
					);
				}
			} else {
				qb.whereRaw("service_issued_fiscal_documents.status ~* ?", [
					data.statuses.join("|"),
				]);
			}
		}
		return qb;
	}

	async receiptsReport(
		authCtx: AuthContext,
		data: {
			businessUnit?: string;
			fromDate?: string;
			toDate?: string;
			supplier?: string;
			status?: string;
		},
	) {
		if (!data.businessUnit) {
			throw new BadRequestException("Unidade não informada", 400, "E_ERR");
		}

		if (!data.fromDate && !data.toDate) {
			throw new BadRequestException("Datas não informadas", 400, "E_ERR");
		}

		const qb = Database.from("receipts")
			.select(
				Database.raw(`
        business_units.identification,
       business_units.city,
       business_units.state,
       receipts.receipt_date,
       receipts.tag,
       receipts.product_value,
       receipts.paid_value,
       receipts.origin,
       receipts.status,
       receipts.supplier_id,
       patients.name
                     `),
			)
			.joinRaw(
				`join business_units on receipts.business_unit_id = business_units.id`,
			)
			.joinRaw(`join patients on receipts.supplier_id = patients.id`)
			.whereRaw(
				`exists (select *
              from "economic_groups"
              where ("system_id" = ?)
                and ("economic_groups"."id" = business_units."economic_group_id"))`,
				[authCtx.system.id],
			)
			.where("receipts.economic_group_id", authCtx.group.id)
			.whereRaw("receipts.receipt_date::date between ?::date and ?::date", [
				data.fromDate!,
				data.toDate!,
			])
			.whereNull("receipts.deleted_at")
			.orderByRaw("receipts.receipt_date, receipts.tag");

		if (data.supplier) {
			qb.where("receipts.supplier_id", data.supplier);
		}

		if (data.status) {
			qb.where("receipts.status", data.status);
		}

		return qb;
	}

	async receiptAnalyticsReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			status?: string;
			client?: string;
			patient?: string;
			businessUnits?: string[];
			economicGroups?: string[];
			businessStates?: string[];
			businessCities?: string[];
		},
	) {
		const qb = Receipt.query()
			.preload("economicGroup")
			.preload("businessUnit")
			.preload("supplier")
			.preload("seller")
			.preload("items", (query) => {
				query.preload("productVariation", (query) => {
					query.preload("product", (query) => {
						query.preload("subgroup");
					});
				});
			})
			.preload("payments", (query) => {
				query.preload("flag").preload("paymentMethod");
			})
			.where("economic_group_id", authCtx.group.id)
			.whereNull("deleted_at")
			.whereHas("businessUnit", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("system_id", authCtx.system.id);
				});
			})
			.orderBy("receipt_date", "desc");

		if (authCtx.user.type === "user") {
			qb.where("economic_group_id", authCtx.group.id);
		} else {
			if (
				data.economicGroups &&
				Array.isArray(data.economicGroups) &&
				data.economicGroups.length > 0
			) {
				qb.whereIn("economic_group_id", data.economicGroups);
			} else {
				qb.where("economic_group_id", authCtx.group.id);
			}
		}

		if (
			data.businessUnits &&
			Array.isArray(data.businessUnits) &&
			data.businessUnits.length > 0
		) {
			qb.whereIn("business_unit_id", data.businessUnits);
		}

		const withBusinessStates =
			data.businessStates &&
			Array.isArray(data.businessStates) &&
			data.businessStates.length > 0;
		const withBusinessCities =
			data.businessCities &&
			Array.isArray(data.businessCities) &&
			data.businessCities.length > 0;
		if (withBusinessStates || withBusinessCities) {
			qb.whereHas("businessUnit", (query) => {
				if (withBusinessStates) {
					query.whereIn("state", data.businessStates ?? []);
				}

				if (withBusinessCities) {
					query.whereIn("city", data.businessCities ?? []);
				}
			});
		}
		if (data.fromDate) {
			qb.whereRaw("receipt_date::date >= ?", [
				DateTime.fromISO(data.fromDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.toDate) {
			qb.whereRaw("receipt_date::date <= ?", [
				DateTime.fromISO(data.toDate).toFormat("yyyy-MM-dd"),
			]);
		}

		if (data.status) {
			qb.where("status", data.status);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			tag: elem.tag,
			receiptDate: elem.receiptDate,
			productValue: elem.productValue,
			serviceValue: elem.serviceValue,
			discountValue: elem.discountValue,
			totalValue: elem.totalValue,
			paidValue: elem.paidValue,
			missingPaymentValue: elem.totalValue - elem.paidValue,
			status: elem.status,
			origin: elem.origin,

			group: {
				id: elem.economicGroup.id,
				name: elem.economicGroup.companyName,
			},
			unit: {
				id: elem.businessUnit.id,
				identification: elem.businessUnit.identification ?? "-",
				city: elem.businessUnit.city,
				state: elem.businessUnit.state,
			},
			seller: this.sharedService.captureGroup(elem.seller, (v) => ({
				id: v.id,
				name: v.name,
			})),
			supplier: this.sharedService.captureGroup(elem.supplier, (v) => ({
				id: v.id,
				name: v.name,
			})),
			payments: elem.payments.map((inner) => ({
				id: inner.id,
				block: inner.block,
				installment: inner.installment,
				installmentValue: inner.installmentValue,
				epxirationDate: inner.expirationDate,
				nsuDocument: inner.nsuDocument,
				paymentMethod: this.sharedService.captureGroup(
					inner.paymentMethod,
					(v) => ({
						id: v.id,
						description: v.description,
					}),
				),
				flag: this.sharedService.captureGroup(inner.flag, (v) => ({
					id: v.id,
					description: v.description,
				})),
			})),
			items: elem.items.map((inner) => ({
				id: inner.id,
				quantity: inner.quantity,
				costValue: inner.costValue,
				saleValue: inner.saleValue,
				discountValue: inner.discountValue,
				totalValue: inner.totalValue,
				unitaryValue: inner.unitaryValue,
				product: this.sharedService.captureGroup(
					inner.productVariation?.product,
					(v) => ({
						description: v.description,
						type: v.type,
						subgroup: this.sharedService.captureGroup(
							inner.productVariation?.product?.subgroup,
							(v) => ({ id: v.id, description: v.description }),
						),
					}),
				),
			})),
		}));
	}

	public crmOpportunities(
		authCtx: AuthContext,
		data: {
			units?: string[];
			statuses?: string[];
			users?: string[];
			contact?: string;
			clients?: string[];
			balances?: string[];
			fromOpening?: string;
			toOpening?: string;
			fromContact?: string;
			toContact?: string;
		},
	) {
		const qb = Database.from("opportunities")
			.select(
				Database.raw(`
        bu.identification                as unidade,
        opportunities.id                 as codigo_oportunidade,
        p.name                           as nome_contato,
        pc.contact                       as celular_contato,
        p2.description                   as profissao,
        co.description                   as origem_cliente,
        opportunities.contact_date       as data_contato,
        opportunities.opening_date       as data_abertura,
        opportunities.created_at         as data_lancamento,
        opportunities.value              as valor_oportunidade,
        opportunities.description        as titulo_oportunidade,
        cs.description                   as status_oportunidade,
        cs2.description                  as assunto_contato,
        ct.description                   as tipo_contato,
        coc.description origem_categoria,
        cog.description origem_grupo,
        u.name                           as responsavel,
        coalesce(balance, 'Em Aberto')   as situacao,
        opportunities.description        as observacao,
        r.reason                         as motivo_ganho_perda,
        opportunities.result_observation as obs_ganho_perda,
        opportunities.profit_value       as valor_ganho,
        userlancamento.name as usuarioLancamento,
        cli.name as nome_paciente,
        races.description as raca_paciente,
        opportunities.gender as genero_paciente,
        opportunities.weight as peso_paciente,
        opportunities.castrated as castrado_paciente,
        coalesce(mc.description, opportunities.client_origin_item_description) as campanha_midia
        `),
			)
			.joinRaw(
				"join business_units bu on opportunities.business_unit_id = bu.id",
			)
			.joinRaw("join users u on opportunities.user_id = u.id")
			.joinRaw("join crm_statuses cs on opportunities.status_id = cs.id")
			.joinRaw(`join ((patients p join (patient_tutors pt left join professions p2 on pt.profession_id = p2.id)
                on p.id = pt.patient_id)
    left join patient_contacts pc on p.id = pc.patient_id and pc."type" = 'celular') on opportunities.contact_id = p.id`)
			.joinRaw("left join patients cli on opportunities.client_id = cli.id")
			.joinRaw(
				"join users userLancamento on opportunities.opening_user_id = userlancamento.id",
			)
			.joinRaw(
				`left join (client_origins co
                    left join client_origin_groups cog on co.client_origin_group_id = cog.id
                    left join client_origin_categories coc on cog.client_origin_category_id = coc.id
                   ) on opportunities.client_origin_id = co.id`,
			)
			.joinRaw(
				"left join contact_subjects cs2 on opportunities.contact_subject_id = cs2.id",
			)
			.joinRaw(
				"left join contact_types ct on opportunities.contact_type_id = ct.id",
			)
			.joinRaw("left join races on opportunities.race_id = races.id")
			.joinRaw("left join reasons r on opportunities.reason_id = r.id")
			.joinRaw(
				"left join marketing_campaigns mc on opportunities.marketing_campaign_id = mc.id",
			)
			.where("opportunities.economic_group_id", authCtx.group.id)
			.whereNull("opportunities.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("opportunities.business_unit_id", data.units);
		} else {
			qb.where("opportunities.business_unit_id", authCtx.unit.id);
		}

		if (data.statuses && Array.isArray(data.statuses)) {
			qb.whereIn("opportunities.status_id", data.statuses);
		}

		if (data.users && Array.isArray(data.users)) {
			qb.whereIn("opportunities.user_id", data.users);
		}

		if (data.contact) {
			qb.where("opportunities.contact_id", data.contact);
		}

		if (data.clients && Array.isArray(data.clients)) {
			qb.whereIn("opportunities.client_id", data.clients);
		}

		if (data.balances && Array.isArray(data.balances)) {
			const hasEmAberto = data.balances.some((r) => r === "Em Aberto");
			const completeRow = data.balances?.join(" ").replace(" ", "|");

			if (hasEmAberto) {
				qb.whereRaw(
					"(opportunities.balance is null or opportunities.balance ~* ?)",
					[completeRow],
				);
			} else {
				qb.whereRaw("opportunities.balance ~* ?", [completeRow]);
			}
		}

		if (data.fromOpening && data.toOpening) {
			qb.andWhereRaw("opportunities.opening_date::date between ? and ?", [
				data.fromOpening,
				data.toOpening,
			]);
		}

		if (data.fromContact && data.toContact) {
			qb.andWhereRaw("opportunities.contact_date::date between ? and ?", [
				data.fromContact,
				data.toContact,
			]);
		}

		return qb;
	}

	public crmOpportunities_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			user?: string;
			status?: string;
			balance?: string[];

			fromOpening?: string;
			toOpening?: string;
			fromContact?: string;
			toContact?: string;
			// fromDate?: string; // /search-kanban
			// toDate?: string; // /search-kanban
		},
	) {
		const qb = Database.from("opportunities")
			.select(
				Database.raw(`contato.name                                 as nome_contato,
       patient_contacts.contact                     as celular,
       patients.name                                as nome_cliente,
       client_origins.description                   as origem_cliente,
       opportunities.client_origin_item_description as campanha_midia,
       opportunities.contact_date                   as data_contato,
       opportunities.opening_date                   as data_abertura,
       opportunities.created_at                     as data_lancamento,
       opportunities.description                    as titulo_oportunidade,
       crm_statuses.description                     as status,
       contact_subjects.description                 as assunto_contato,
       contact_types.description                    as tipo_contato,
       coalesce(opportunities.balance, 'Aberta')    as situacao`),
			)
			.joinRaw(
				`join (patients contato left join patient_contacts
               on contato.id = patient_contacts.patient_id and patient_contacts."type" = 'celular')
              on opportunities.contact_id = contato.id`,
			)
			.joinRaw("left join patients on opportunities.client_id = patients.id")
			.joinRaw(
				"left join client_origins on opportunities.client_origin_id = client_origins.id",
			)
			.joinRaw(
				"left join crm_statuses on crm_statuses.id = opportunities.status_id",
			)
			.joinRaw(
				"left join contact_subjects on opportunities.contact_subject_id = contact_subjects.id",
			)
			.joinRaw(
				"left join contact_types on opportunities.contact_type_id = contact_types.id",
			)
			.where("opportunities.economic_group_id", authCtx.group.id)
			.whereNull("opportunities.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("opportunities.business_unit_id", data.units);
		} else {
			qb.where("opportunities.business_unit_id", authCtx.unit.id);
		}

		if (data.user) {
			qb.where("opportunities.user_id", data.user);
		}

		if (data.status) {
			qb.where("opportunities.status_id", data.status);
		}

		if (data.balance && Array.isArray(data.balance)) {
			qb.whereRaw("opportunities.balance ~* ?", [
				data.balance.map((d) => d.toLowerCase()).join("|"),
			]);
		}

		if (data.fromOpening && data.toOpening) {
			qb.andWhereRaw("opportunities.opening_date::date between ? and ?", [
				data.fromOpening,
				data.toOpening,
			]);
		}

		if (data.fromContact && data.toContact) {
			qb.andWhereRaw("opportunities.contact_date::date between ? and ?", [
				data.fromContact,
				data.toContact,
			]);
		}

		// if (data.fromDate && data.toDate) {
		// 	qb.whereRaw(
		// 		`(
		//   (opportunities.opening_date::date between ? and ?)
		//       or (opportunities.id in (select distinct opportunity_id
		//                                from schedules
		//                                         left join (schedule_status_changes join schedule_statuses
		//                                                    on schedule_status_changes.schedule_status_id =
		//                                                       schedule_statuses.id and schedule_statuses.type in ('REC'))
		//                                                   on schedules.id = schedule_status_changes.schedule_id
		//                                where schedules.opportunity_id = opportunities.id
		//                                  and (schedules.start_hour::date between ? and ?
		//                                    or
		//                                       schedule_status_changes.created_at::date between ? and ?)))
		//                             or (opportunities.id in (select distinct opportunity_id
		//                            from opportunity_logs ol
		//                                     join crm_statuses cs on ol.status_id = cs.id and cs.tag = 'A'
		//                            where ol.created_at::date between ? and ?)
		//          )
		//     )`,
		// 		[
		// 			data.fromDate,
		// 			data.toDate,
		// 			data.fromDate,
		// 			data.toDate,
		// 			data.fromDate,
		// 			data.toDate,
		// 			data.fromDate,
		// 			data.toDate,
		// 		],
		// 	);
		// }

		return qb;
	}

	public crmActivies(
		authCtx: AuthContext,
		data: {
			units?: string[];
			activity?: string;
			user?: string;
			status?: string;

			fromIssue?: string;
			toIssue?: string;
			fromExecution?: string;
			toExecution?: string;
		},
	) {
		const qb = Database.from("opportunities")
			.select(
				Database.raw(`contato.name                         as nome_contato,
       pc.contact                           as celular,
       patients.name                        as nome_cliente,
       opportunities.contact_date           as data_contato,
       opportunities.opening_date           as data_abertura,
       opportunities.description            as titulo_pportunidade,
       activities.description               as atividade,
       ou."name"                            as usuario_abertura,
       opportunity_activities.issue_date    as data_lancamento,
       execution_date                       as data_agendamento,
       eu.name                              as usuario_execucao,
       opportunity_activities.executed_date as data_execucao,
       opportunity_activities.status,
       opportunity_activities.observation   as anotacoes,
       result_observation                   as observacoes_execucao`),
			)
			.joinRaw(`join (patients contato left join patient_contacts pc on contato.id = pc.patient_id and pc."type" = 'celular')
              on opportunities.contact_id = contato.id`)
			.joinRaw("left join patients on opportunities.client_id = patients.id")

			.joinRaw(
				"left join opportunity_activities on opportunities.id = opportunity_activities.opportunity_id",
			)
			.joinRaw(
				"join activities on opportunity_activities.activity_id = activities.id",
			)
			.joinRaw(
				"join users ou on opportunity_activities.opening_user_id = ou.id",
			)
			.joinRaw(
				"left join users eu on opportunity_activities.execution_user_id = eu.id",
			)
			.orderByRaw(
				"opportunity_activities.created_at, opportunity_activities.execution_date, opportunity_activities.executed_date",
			)
			.where("opportunities.economic_group_id", authCtx.group.id)
			.whereNull("opportunities.deleted_at")
			.whereNull("opportunity_activities.deleted_at")
			.whereNot(
				"opportunity_activities.status",
				"Excluida" as TOpportunityActivityStatus,
			);

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("opportunities.business_unit_id", data.units);
		} else {
			qb.where("opportunities.business_unit_id", authCtx.unit.id);
		}

		if (data.user) {
			qb.where("opportunity_activities.user_id", data.user);
		}

		if (data.activity) {
			qb.where("opportunity_activities.activity_id", data.activity);
		}

		if (data.status) {
			qb.where("opportunity_activities.status", data.status);
		}

		if (data.fromIssue && data.toIssue) {
			qb.andWhereRaw(
				"opportunity_activities.issue_date::date between ? and ?",
				[data.fromIssue, data.toIssue],
			);
		}

		if (data.fromExecution && data.toExecution) {
			qb.andWhereRaw(
				"opportunity_activities.execution_date::date between ? and ?",
				[data.fromExecution, data.toExecution],
			);
		}

		return qb;
	}

	async clientLogReport(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			units?: string[];
		},
	) {
		if (!data.fromDate || !data.toDate) {
			throw new BadRequestException(
				"Faltam as datas de início e fim",
				400,
				"E_ERR",
			);
		}

		const fromDate: string = data.fromDate ?? "";
		const toDate: string = data.toDate ?? "";

		const qb = Database.from("patients")
			.with("_bills", (qb) => {
				qb.from("bills").whereRaw("bill_date::date between ? and ?", [
					fromDate,
					toDate,
				]);
			})
			.with("_schedules", (qb) => {
				qb.from("schedules").whereRaw("created_at::date between ? and ?", [
					fromDate,
					toDate,
				]);
			})
			.with("_payments", (qb) => {
				qb.from("bill_payments")
					.whereRaw("bill_id in (select id from _bills)")
					.whereRaw("created_at::date between ? and ?", [fromDate, toDate]);
			})
			.with("_finances", (qb) => {
				qb.from("finances").whereRaw("payment_date::date between ? and ?", [
					fromDate,
					toDate,
				]);
			})
			.with("_budgets", (qb) => {
				qb.from("budgets").whereRaw("budget_date::date between ? and ?", [
					fromDate,
					toDate,
				]);
			})
			.with("_attendances", (qb) => {
				qb.from("attendances").whereRaw("created_at::date between ? and ?", [
					fromDate,
					toDate,
				]);
			})
			.select(
				Database.raw(`
        patients.id                                 as patient_id,
        patients.name                               as patient_name,
        patient_contacts.contact                    as patient_main_contact,
        patients.created_at                         as patient_created,
        patients.updated_at                         as patient_updated,
        patients.deleted_at                         as patient_excluded,

        (select max(_schedules.created_at)
          from _schedules
          where _schedules.patient_id = patients.id
            and _schedules.deleted_at is null)       as patient_last_new_schedule_timestamp,

        (select max(_schedules.updated_at)
          from _schedules
          where _schedules.patient_id = patients.id
            and _schedules.deleted_at is null)       as patient_last_updated_schedule_timestamp,

        (select max(schedules.deleted_at)
          from schedules
          where schedules.patient_id = patients.id
            and schedules.deleted_at is not null)    as patient_last_excluded_schedule_timestamp,

        (select max(_bills.created_at)
          from _bills
          where _bills.patient_id = patients.id
            and _bills.deleted_at is null)           as patient_last_new_sale_timestamp,
        (select max(_bills.updated_at)
          from _bills
          where _bills.patient_id = patients.id
            and _bills.deleted_at is null)           as patient_last_updated_sale_timestamp,
        (select max(_bills.deleted_at)
          from _bills
          where _bills.patient_id = patients.id
            and _bills.deleted_at is not null)       as patient_last_excluded_sale_timestamp,

        (select max(_payments.created_at)
          from _payments
          where _payments.bill_id = (select id
                                   from _bills
                                   where _bills.patient_id = patients.id
                                     and _bills.deleted_at is null
                                   order by patients.created_at
                                   limit 1)
            and _payments.deleted_at is null)        as patient_last_new_sale_payment_timestamp,
        (select max(_payments.updated_at)
          from _payments
          where _payments.bill_id = (select id
                                   from _bills
                                   where _bills.patient_id = patients.id
                                     and _bills.deleted_at is null
                                   order by patients.updated_at
                                   limit 1)
            and _payments.deleted_at is null)        as patient_last_updated_sale_payment_timestamp,
        (select max(_payments.deleted_at)
          from _payments
          where _payments.bill_id = (select id
                                   from _bills
                                   where _bills.patient_id = patients.id
                                     and _bills.deleted_at is not null
                                   order by patients.deleted_at
                                   limit 1)
            and _payments.deleted_at is not null)    as patient_last_excluded_sale_payment_timestamp,

        (select max(_finances.created_at)
          from _finances
          where _finances.client_id = patients.id
            and _finances.deleted_at is null)        as patient_last_new_finance_timestamp,
        (select max(_finances.updated_at)
          from _finances
          where _finances.client_id = patients.id
            and _finances.deleted_at is null)        as patient_last_updated_finance_timestamp,
        (select max(_finances.deleted_at)
          from _finances
          where _finances.client_id = patients.id
            and _finances.deleted_at is not null)    as patient_last_excluded_finance_timestamp,

        (select max(_budgets.created_at)
          from _budgets
            where _budgets.client_id = patients.id
            and _budgets.deleted_at is null)         as patient_last_new_budget_timestamp,
        (select max(_budgets.updated_at)
          from _budgets
            where _budgets.client_id = patients.id
            and _budgets.deleted_at is null)         as patient_last_updated_budget_timestamp,
        (select max(_budgets.deleted_at)
          from _budgets
          where _budgets.client_id = patients.id
            and _budgets.deleted_at is not null)     as patient_last_budget_finance_timestamp,

        (select max(_attendances.created_at)
          from _attendances
          where _attendances.patient_id = patients.id
            and _attendances.deleted_at is null)     as patient_last_new_attendance_timestamp,
        (select max(_attendances.updated_at)
          from _attendances
          where _attendances.patient_id = patients.id
            and _attendances.deleted_at is null)     as patient_last_updated_attendance_timestamp,
        (select max(_attendances.deleted_at)
          from _attendances
          where _attendances.patient_id = patients.id
            and _attendances.deleted_at is not null) as patient_last_budget_attendance_timestamp`),
			)
			.joinRaw(`left join patient_contacts
                   on patients.id = patient_contacts.patient_id and patient_contacts.main and
                      patient_contacts.type = 'celular' and
                      patient_contacts.created_at = (select max(pc.created_at)
                                                     from patient_contacts pc
                                                     where pc.patient_id = patients.id)`)
			.joinRaw(
				"join patient_economic_groups on patients.id = patient_economic_groups.patient_id",
			)
			.joinRaw(
				`join economic_groups on patient_economic_groups.economic_group_id = economic_groups.id and
                                 economic_groups.id = ?`,
				[authCtx.group.id],
			)
			.joinRaw(
				"join business_units on economic_groups.id = business_units.economic_group_id",
			);

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		const result = await qb;

		const tasks = result.map(async (r) => {
			const lastCreatedTimeline = await AnimalTimeline.find({
				"timeline_info.tag": r.patient_id,
				"extras.deletedAt": null,
			})
				.sort({ createdAt: -1 })
				.limit(1);

			const lastUpdatedTimeline = await AnimalTimeline.find({
				"timeline_info.tag": r.patient_id,
				"extras.deletedAt": null,
			})
				.sort({ updatedAt: -1 })
				.limit(1);

			const lastExcludedTimeline = await AnimalTimeline.find({
				"timeline_info.tag": r.patient_id,
				"extras.deletedAt": { $ne: null },
			})
				.sort({ updatedAt: -1 })
				.limit(1);

			Object.assign(r, {
				patient_last_created_timeline_type:
					lastCreatedTimeline?.at(0)?.timeline_type?.description ?? null,
				patient_last_created_timeline_timestamp:
					lastCreatedTimeline?.at(0)?.createdAt ?? null,

				patient_last_updated_timeline_type:
					lastUpdatedTimeline?.at(0)?.timeline_type?.description ?? null,
				patient_last_updated_timeline_timestamp:
					lastUpdatedTimeline?.at(0)?.createdAt ?? null,

				patient_last_excluded_timeline_type:
					lastExcludedTimeline?.at(0)?.timeline_type?.description ?? null,
				patient_last_excluded_timeline_timestamp:
					lastExcludedTimeline?.at(0)?.createdAt ?? null,
			});

			return r;
		});
		return await Promise.all(tasks);
	}

	public vaccineVermifuge(
		authCtx: AuthContext,
		data: {
			type?: string;
			units?: string[];
			fromScheduling?: string;
			toScheduling?: string;
			fromApplication?: string;
			toApplication?: string;
			specie?: string;
			vaccine?: string;
			protocol?: string;
			status?: string;
			order?: string;
			debug?: string;
		},
	) {
		if (!data.type) {
			throw new BadRequestException(
				"É preciso informar o tipo de vacina",
				400,
				"E_ERR",
			);
		}
		if (data.type !== "vaccine" && data.type !== "vermifuge") {
			throw new BadRequestException(
				"É preciso informar um tipo válido de vacina",
				400,
				"E_ERR",
			);
		}

		if (data.type === "vaccine" && !authCtx.hasPermission("REL13")) {
			throw new UnauthorizedException(
				"Sem permissão para ver o relatório",
				401,
				"E_ERR",
			);
		}
		if (data.type === "vermifuge" && !authCtx.hasPermission("REL14")) {
			throw new UnauthorizedException(
				"Sem permissão para ver o relatório",
				401,
				"E_ERR",
			);
		}

		const qb = Database.from("patient_vaccines")
			.select(
				Database.raw(`
			  business_units.identification                                            as unidade,
        p."name"                                                                 as paciente,
        t.name                                                                   as tutor,
        patient_contacts.contact                                                 as contato_tutor,
        case when vaccines."type" = 'vaccine' then 'vacina' else 'vermifugo' end as vacina_vermifugo,
        vaccines.name                                                            as nome_vacina,
        vaccines.description                                                     as descricao_vacina,
        vaccine_protocols."name"                                                 as nome_protocolo,
        coalesce(species.description, 'Todas')                                   as especie,
        vaccine_calendars.scheduling_date::date                                  as data_agendamento,
        vaccine_calendars.application_date::date                                 as data_aplicacao,
        vaccine_calendars.dose                                                   as dose,
        vaccine_calendars.laboratory                                             as laboratorio,
        vaccine_calendars.batch                                                  as lote,
        case
           when vaccine_calendars.application_date is not null then 'Dose aplicada'
           when vaccine_calendars.application_date is null and vaccine_calendars.scheduling_date::date < now()::date
               then 'Dose pendente - atrasada'
           when vaccine_calendars.application_date is null and vaccine_calendars.scheduling_date::date >= now()::date
               then 'Dose pendente - em dia' end                                as status
       `),
			)
			.joinRaw(
				"join vaccine_calendars on patient_vaccines.id = vaccine_calendars.patient_vaccine_id",
			)
			.joinRaw("join vaccines on vaccines.id = patient_vaccines.vaccine_id")
			.joinRaw(
				"join vaccine_protocols on vaccine_protocols.id = patient_vaccines.vaccine_protocol_id",
			)
			.joinRaw("join patients p on p.id = patient_vaccines.patient_id")
			.joinRaw("join species on vaccine_protocols.specie_id = species.id")
			.joinRaw(
				"join holder_dependents on p.id = holder_dependents.dependent_id",
			)
			.joinRaw("join patients t on holder_dependents.holder_id = t.id")
			.joinRaw(
				"left join patient_contacts on t.id = patient_contacts.patient_id and patient_contacts.type = 'celular'",
			)
			.joinRaw(
				"join business_units on patient_vaccines.business_unit_id = business_units.id",
			)
			.where("vaccines.system_id", authCtx.system.id)
			.where("business_units.economic_group_id", authCtx.group.id)
			.where("vaccines.type", data.type);

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("patient_vaccines.business_unit_id", data.units);
		} else {
			qb.where("patient_vaccines.business_unit_id", authCtx.unit.id);
		}

		if (data.specie) {
			qb.whereRaw(
				"(vaccine_protocols.specie_id = ? or vaccine_protocols.specie_id is null)",
				[data.specie],
			);
		}

		if (data.protocol) {
			qb.where("vaccine_protocols.id", data.protocol);
		}

		if (data.vaccine) {
			qb.where("vaccines.id", data.vaccine);
		}

		if (data.fromScheduling && data.toScheduling) {
			qb.whereRaw("vaccine_calendars.scheduling_date::date between ? and ?", [
				data.fromScheduling,
				data.toScheduling,
			]);
		}

		if (data.fromApplication && data.toApplication) {
			qb.whereRaw("vaccine_calendars.application_date::date between ? and ?", [
				data.fromApplication,
				data.toApplication,
			]);
		}

		if (data.status === "Dose aplicada") {
			qb.whereRaw("vaccine_calendars.application_date is not null");
		} else if (data.status === "Dose pendente - atrasada") {
			qb.whereRaw(
				"(vaccine_calendars.application_date is null and vaccine_calendars.scheduling_date::date < now()::date)",
			);
		} else if (data.status === "Dose pendente - em dia") {
			qb.whereRaw(
				"(vaccine_calendars.application_date is null and vaccine_calendars.scheduling_date::date >= now()::date)",
			);
		}

		if (data.order === "Protocolo") {
			qb.orderByRaw(
				"business_units.identification, vaccines.name, vaccine_protocols.name, vaccine_calendars.scheduling_date, p.name",
			);
		} else if (data.order === "Data Agendamento") {
			qb.orderByRaw(
				"business_units.identification, vaccine_calendars.scheduling_date, vaccine_calendars.application_date, p.name",
			);
		} else if (data.order === "Data Aplicacao") {
			qb.orderByRaw(
				"business_units.identification, vaccine_calendars.application_date, vaccine_calendars.scheduling_date, p.name",
			);
		}

		if (data.debug) {
			return qb.toQuery();
		}

		return qb;
	}

	public async marketingCampaign(
		authCtx: AuthContext,
		data: {
			units?: string[];
			marketingCampaign?: number;
			active?: string;
			fromDate?: string;
			toDate?: string;
			debug?: string;
		},
	) {
		const qb = Database.from("marketing_campaigns")
			.select(
				Database.raw(`economic_groups.id                                  as e_id,
       economic_groups.company_name                        as e_name,
       business_units.id                                   as b_id,
       business_units.identification,
       marketing_campaigns.id,
       marketing_campaigns.description,
       marketing_campaigns.start_date,
       marketing_campaigns.end_date,
       marketing_campaigns.investment_value::float,
       marketing_campaigns.active,
       count(opportunities.id)::int                        as qty_opportunities,
       coalesce(sum(opportunities.profit_value), 0)::float as sum_opportunity_profit,
       coalesce(sum(opportunities.value), 0)::float as sum_opportunity_value,
       case
           when count(opportunities.id) = 0 then 0::float
           else (investment_value / count(opportunities.id))::float
           end                                             as cpl,
         sum(case when cs.type = 'OP' and tag = 'N' and opportunities.balance is null then 1 else 0 end) as qtd_novas,
sum(case when cs.type = 'OP' and tag = 'A' and opportunities.balance is null then 1 else 0 end) as qtd_agendadas,
sum(case when cs.type = 'OP' and tag = 'C' and opportunities.balance is null then 1 else 0 end) as qtd_comparecidas,
sum(case when cs.type = 'OP' and tag = 'F' and opportunities.balance is null then 1 else 0 end) as qtd_faltou,
sum(case when cs.type = 'OP' and tag = 'D' and opportunities.balance is null then 1 else 0 end) as qtd_desmarcou,
sum(case when cs.type = 'OP' and tag = 'FE' and opportunities.balance is null then 1 else 0 end) as qtd_fechadas,
sum(case when opportunities.balance = 'Ganho' then 1 else 0 end) as qtd_ganhos,
sum(case when opportunities.balance = 'Perda' then 1 else 0 end) as qtd_perdas`),
			)
			.joinRaw(
				"join economic_groups on marketing_campaigns.economic_group_id = economic_groups.id",
			)
			.joinRaw(
				"join business_units on economic_groups.id = business_units.economic_group_id",
			)
			.joinRaw(
				`left join ( opportunities
left join crm_statuses cs on opportunities.status_id = cs.id) on marketing_campaigns.id = opportunities.marketing_campaign_id`,
			)
			.groupByRaw(
				"economic_groups.id, business_units.id, marketing_campaigns.id",
			)
			.where("economic_groups.id", authCtx.group.id);

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.marketingCampaign) {
			qb.where("marketing_campaigns.id", data.marketingCampaign);
		}

		if (data.active) {
			qb.where("marketing_campaigns.active", data.active === "true");
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw(
				`(
          (marketing_campaigns.start_date between ? and ?) or
          (marketing_campaigns.end_date between ? and ?)
        )`,
				[data.fromDate, data.toDate, data.fromDate, data.toDate],
			);
		}

		if (data.debug) {
			return qb.toQuery();
		}

		const result: {
			e_id: string;
			e_name: string;
			b_id: string;
			identification: string;
			id: number;
			description: string;
			start_date: string;
			end_date: string;
			investment_value: number;
			active: boolean;
			qty_opportunities: number;
			sum_opportunity_profit: number;
			sum_opportunity_value: number;
			cpl: number;
			qtd_novas: string;
			qtd_agendadas: string;
			qtd_comparecidas: string;
			qtd_faltou: string;
			qtd_desmarcou: string;
			qtd_fechadas: string;
			qtd_ganhos: string;
			qtd_perdas: string;
		}[] = await qb;

		const groups = SharedService.GroupBy(result, (row) => [row.e_id, row.b_id]);

		return Object.keys(groups).reduce((accumulator, row) => {
			const [group, unit] = row.split("___");

			accumulator.push({
				group: {
					id: result.find((r) => r.e_id === group)?.e_id,
					fantasyName: result.find((r) => r.e_id === group)?.e_name,
					units: [
						{
							id: result.find((r) => r.b_id === unit)?.b_id,
							identification: result.find((r) => r.b_id === unit)
								?.identification,
							campaigns: result
								.filter((f) => f.e_id === group && f.b_id === unit)
								.map((c) => ({
									id: c.id,
									description: c.description,
									startDate: c.start_date,
									endDate: c.end_date,
									investmentValue: c.investment_value,
									active: c.active,
									qtyOpportunities: c.qty_opportunities,
									sumOpportunityProfit: c.sum_opportunity_profit,
									sumOpportunityValue: c.sum_opportunity_value,
									cpl: c.cpl,
									qtyNovas: Number.parseFloat(c.qtd_novas),
									qtyAgendadas: Number.parseFloat(c.qtd_agendadas),
									qtyComparecidas: Number.parseFloat(c.qtd_comparecidas),
									qtyFaltou: Number.parseFloat(c.qtd_faltou),
									qtyDesmarcou: Number.parseFloat(c.qtd_desmarcou),
									qtyFechadas: Number.parseFloat(c.qtd_fechadas),
									qtyGanhos: Number.parseFloat(c.qtd_ganhos),
									qtyPerdas: Number.parseFloat(c.qtd_perdas),
								})),
						},
					],
				},
			});

			return accumulator;
		}, [] as unknown[]);
	}

	public async dreGroupReport(
		authCtx: AuthContext,
		data: { period?: string; v2?: string },
	) {
		if (!data.period) {
			throw new BadRequestException("Periodo não informado", 400, "E_REQ");
		}

		const dreGroups: {
			id: number;
			description: string;
			sequence: number;
		}[] = await Database.from("dre_groups")
			.select("id", "description", "sequence")
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? OR economic_group_id IS NULL)", [
				authCtx.group.id,
			])
			.whereNull("deleted_at")
			.orderBy("sequence");

		const accountPlanGroups: {
			id: number;
			description: string;
			type: "CREDITO" | "DEBITO";
			dre_group_id: number | null;
			dre_basis: boolean;
		}[] = await Database.from("account_plan_groups")
			.select(Database.raw("id, description, type, dre_group_id, dre_basis"))
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? OR economic_group_id IS NULL)", [
				authCtx.group.id,
			])
			.orderByRaw("dre_group_id, type, description");

		const accountPlanParents: {
			id: string;
			description: string;
			type: "CREDITO" | "DEBITO";
			account_plan_group_id: number | null;
			custo: number;
			total: number;
			tag: string;
			ref: string;
		}[] = await Database.from("account_plans")
			.select(
				Database.raw(`account_plans.id,
       description,
       account_plans.type,
       account_plan_group_id,
       coalesce(dcpi.cost::float, 0) as custo,
       coalesce(sum(finances.total_value), 0)::float as total,
       account_plans.tag,
       case when account_plans."type" = 'DEBITO' then ' - ' || tag else ' + ' || tag end as ref`),
			)
			.joinRaw(
				"left join (dre_cost_plannings dcp join dre_cost_planning_items dcpi on dcp.id = dcpi.dre_cost_planning_id and dcp.deleted_at is null) on dcp.period = ? and dcp.business_unit_id = ? and account_plans.id = dcpi.account_plan_id",
				[data.period, authCtx.unit.id],
			)
			.joinRaw(
				"left join finances on account_plans.id = finances.account_plan_id and finances.deleted_at is null and to_char(finances.expiration_date, 'MM/YYYY') = ?",
				[data.period],
			)
			.where("system_id", authCtx.system.id)
			.whereRaw(
				"(account_plans.economic_group_id = ? OR account_plans.economic_group_id IS NULL)",
				[authCtx.group.id],
			)
			.where("dre", true)
			.whereNull("parent_id")
			.whereNull("account_plans.deleted_at")
			.groupByRaw("account_plans.id, dcpi.cost")
			.orderByRaw("account_plan_group_id, type, description");

		const accountPlanChildren: {
			id: string;
			description: string;
			type: "CREDITO" | "DEBITO";
			account_plan_group_id: number | null;
			parent_id: string;
			custo: number;
			total: number;
			tag: string;
			ref: string;
		}[] = await Database.from("account_plans")
			.select(
				Database.raw(`account_plans.id,
       description,
       account_plans.type,
       account_plan_group_id,
       parent_id,
       coalesce(dcpi.cost, 0)::float as custo,
       coalesce(sum(finances.total_value), 0)::float as total,
       account_plans.tag,
       case when account_plans."type" = 'DEBITO' then ' - ' || tag else ' + ' || tag end as ref`),
			)
			.joinRaw(
				"left join (dre_cost_plannings dcp join dre_cost_planning_items dcpi on dcp.id = dcpi.dre_cost_planning_id and dcp.deleted_at is null) on dcp.period = ? and dcp.business_unit_id = ? and account_plans.id = dcpi.account_plan_id",
				[data.period, authCtx.unit.id],
			)
			.joinRaw(
				"left join finances on account_plans.id = finances.account_plan_id and finances.deleted_at is null and to_char(finances.expiration_date, 'MM/YYYY') = ?",
				[data.period],
			)
			.where("account_plans.system_id", authCtx.system.id)
			.whereRaw(
				"(account_plans.economic_group_id = ? OR account_plans.economic_group_id IS NULL)",
				[authCtx.group.id],
			)
			.where("dre", true)
			.whereNotNull("parent_id")
			.whereNull("account_plans.deleted_at")
			.groupByRaw("account_plans.id, dcpi.cost")
			.orderByRaw("parent_id, type, description");

		return [
			{
				id: authCtx.unit.id,
				identification: authCtx.unit.identification,
				periodo: data.period,
				itens: dreGroups.map((group) => {
					const accountPlans = accountPlanGroups
						.filter((a) => a.dre_group_id === group.id)
						.map((app) => {
							const parents = accountPlanParents
								.filter((ap) => ap.account_plan_group_id === app.id)
								.map((ap) => {
									const contas = accountPlanChildren
										.filter((apc) => apc.parent_id === ap.id)
										.map((apc) => ({
											id: apc.id,
											// ref: apc.ref,
											tag: apc.tag,
											basear: false,
											description: apc.description,
											type: apc.type,
											custo: apc.custo,
											total: apc.total,
										}));

									return {
										id: ap.id,
										tag: ap.tag,
										basear: false,
										description: ap.description,
										type: ap.type,
										custo: contas.reduce((acc, curr) => acc + curr.custo, 0),
										total: contas.reduce((acc, curr) => acc + curr.total, 0),
										refCusto: accountPlanChildren
											.filter((apc) => apc.parent_id === ap.id)
											.map((c) => c.ref)
											.join(" "),
										refs: contas.map((c) => c.id),
										itens: contas,
									};
								});

							return {
								id: app.id,
								basear: app.dre_basis,
								description: app.description,
								type: app.type,
								custo: parents.reduce((acc, curr) => acc + curr.custo, 0),
								total: parents.reduce((acc, curr) => acc + curr.total, 0),
								refCusto: parents
									.map((p) =>
										p.itens.length === 0
											? `${p.type === "CREDITO" ? "+" : "-"} ${p.tag}`
											: p.refCusto,
									)
									.join(" ")
									.trim(),
								refs: parents.map((c) => c.id),
								itens: parents,
							};
						});

					return {
						id: group.id,
						basear: false,
						description: group.description,
						custo: accountPlans.reduce((acc, curr) => acc + curr.custo, 0),
						total: accountPlans.reduce((acc, curr) => acc + curr.total, 0),
						refCusto: accountPlans
							.flatMap((c) => c.refCusto)
							.join(" ")
							.trim(),
						refs: accountPlans.map((c) => c.id),
						itens: accountPlans,
					};
				}),
			},
		];
	}

	public async patientsReport(
		authCtx: AuthContext,
		data: {
			species?: string[];
			races?: string[];
			gender?: string;
			castrated?: string;
			death?: string;
			microchip?: string;
			vaccineOrigin?: string;
		},
	) {
		if (!authCtx.hasPermission("REL16")) {
			throw new UnauthorizedException(
				"Sem permissão para ver o relatório",
				400,
				"E_ERR",
			);
		}

		const qb = Database.from("holder_dependents")
			.select(
				Database.raw(`pt.name                                                                as tutor_nome,
       t.cellphone                                                                           as tutor_celular,
       t.telephone                                                                           as tutor_telefone,
       t.email                                                                               as tutor_email,
       CASE WHEN pt.gender = 'male' THEN 'MASCULINO' ELSE 'FEMININO' END                     as tutor_genero,
       prof.description                                                                      as tutor_profissao,
       pt.birth_date                                                                         as tutor_dt_nasc,
       pt.created_at::date                                                                   as tutor_dt_cadastro,
       pp.tag                                                                                as pet_Rg,
       pp.name                                                                               as pet_Nome,
       CASE WHEN pp.gender = 'male' THEN 'MACHO' ELSE 'FÊMEA' END                            as pet_Genero,
       pp.birth_date                                                                         as pet_Data_Nascimento,
       pp.vaccine_origin                                                                     as pet_Vacinado,
       CASE WHEN pet.death = true THEN 'SIM' ELSE '' END                                     as pet_Obito,
       CASE WHEN pet.castrated = true THEN 'SIM' ELSE 'NÃO' END                              as pet_Castrado,
       species.description || ' > ' || races.description                                     as pet_EspecieRaca,
       pp.weight                                                                             as pet_Peso,
       pp.tags                                                                               as pet_Observacao,
       pp.created_at::date                                                                   as pet_Dt_Cadastro,
       (select 'SIM' protocolo from patient_vaccines pv where pp.id = pv.patient_id limit 1) as pet_Tem_Protocolo_Vacina,
       pp.community                                                                          as pet_Comunidade_Sancla,
       pp.first_sale                                                                         as pet_Data_Primeira_Venda,
       pp.last_sale                                                                          as pet_Data_Ultima_Venda`),
			)
			.joinRaw("join patients pt on holder_dependents.holder_id = pt.ID")
			.joinRaw(
				"join patients pp on holder_dependents.dependent_id = pp.ID and holder_dependents.is_main = true",
			)
			.joinRaw(
				"join (patient_tutors t left join professions prof on t.profession_id = prof.id) on pt.id = t.patient_id",
			)
			.joinRaw(`join (patient_animals pet left join (races join species on races.specie_id = species.id)
               on pet.race_id = races.id) on pp.id = pet.patient_id`)
			.joinRaw(
				"join patient_economic_groups pgroup on pp.id = pgroup.patient_id",
			)
			.whereRaw("pgroup.economic_group_id = ?", [authCtx.group.id]);

		if (data.species && Array.isArray(data.species)) {
			qb.whereIn("species.id", data.species);
		}

		if (data.races && Array.isArray(data.races)) {
			qb.whereIn("races.id", data.races);
		}

		if (data.gender) {
			switch (data.gender) {
				case "Macho":
					qb.whereRaw("pp.gender = ?", ["masculino"]);
					break;
				case "Femea":
					qb.whereRaw("pp.gender = ?", ["feminino"]);
					break;
				case "Outros":
					qb.whereRaw("pp.gender = ?", ["outros"]);
					break;
			}
		}

		if (data.castrated) {
			qb.whereRaw("pet.castrated = ?", [data.castrated === "true"]);
		}

		if (data.death) {
			switch (data.death) {
				case "Sim":
					qb.whereRaw("pet.death_date is not null");
					break;
				case "Nao":
					qb.whereRaw("pet.death_date is null");
					break;
			}
		}

		if (data.vaccineOrigin) {
			switch (data.vaccineOrigin) {
				case "Não Vacinado":
					qb.whereRaw("pp.vaccine_origin = ?", ["NAO_VACINADO"]);
					break;
				case "Fora da Clinica":
					qb.whereRaw("pp.vaccine_origin = ?", ["FORA_DA_CLINICA"]);
					break;
				case "Propria Clinica":
					qb.whereRaw("pp.vaccine_origin = ?", ["PROPRIA_CLINICA"]);
					break;
				case "Não Informado":
				default:
					qb.whereRaw("pp.vaccine_origin is null");
			}
		}

		if (data.microchip) {
			switch (data.microchip) {
				case "Sim":
					qb.whereRaw("pet.microchip is not null");
					break;
				case "Nao":
					qb.whereRaw("pet.microchip is null");
					break;
			}
		}
		//
		// if (data.fromCreated && data.toCreated) {
		// 	qb.andWhereRaw("patients.created_at::date between ? and ?", [
		// 		data.fromCreated,
		// 		data.toCreated,
		// 	]);
		// }
		//
		// if (data.fromBirth && data.toBirth) {
		// 	qb.andWhereRaw("patients.birth_date::date between ? and ?", [
		// 		data.fromBirth,
		// 		data.toBirth,
		// 	]);
		// }
		//
		// if (data.debug) {
		// 	return qb.toQuery();
		// }

		const result: Record<string, unknown>[] = await qb;

		return result.reduce(
			(aggregate, record) => {
				aggregate.push(
					Object.keys(record).reduce(
						(recordAggregate, key) => {
							recordAggregate[string.camelCase(key)] = record[key];
							return recordAggregate;
						},
						{} as Record<string, unknown>,
					),
				);

				return aggregate;
			},
			[] as Record<string, unknown>[],
		);
	}

	private calculateDailyFlow(finances: Finance[]) {
		const dataSet = new Map<string, { credit: number; debit: number }>();

		finances.forEach((f) => {
			const date = f.expirationDate.toFormat("yyyy-MM-dd");
			if (!dataSet.has(date)) {
				dataSet.set(date, { credit: 0, debit: 0 });
			}

			const entry = dataSet.get(date)!;
			if (f.type === FinanceType.C) {
				entry.credit += f.totalValue;
			} else {
				entry.debit += f.totalValue;
			}

			dataSet.set(date, entry);
		});

		const result = Object.fromEntries(dataSet.entries());
		const keys = Object.keys(result).sort();

		return keys.map((k) => ({
			[k]: result[k],
		}));
	}
}
