import Hash from "@ioc:Adonis/Core/Hash";
import Database, {
	type TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import Bill, { BillStatus } from "App/Models/Bill";
import BillItem, { BillItemStatus } from "App/Models/BillItem";
import BillPayment, { BillPaymentFeeType } from "App/Models/BillPayment";
import BudgetPayment from "App/Models/BudgetPayment";
import BusinessUnit from "App/Models/BusinessUnit";
import BusinessUnitCheckingAccountPaymentMethod from "App/Models/BusinessUnitCheckingAccountPaymentMethod";
import DailyCashier, { DailyCashierStatus } from "App/Models/DailyCashier";
import DepositItem from "App/Models/DepositItem";
import Finance, {
	FinanceAccept,
	FinanceOriginFlag,
	FinanceStatus,
	FinanceType,
} from "App/Models/Finance";
import IssuedFiscalDocument from "App/Models/IssuedFiscalDocument";
import Kit from "App/Models/Kit";
import Patient, { PatientType } from "App/Models/Patient";
import PaymentMethod from "App/Models/PaymentMethod";
import PaymentMethodFlagInstallment from "App/Models/PaymentMethodFlagInstallment";
import Product, { ProductPurpose, ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import ProductivityItem from "App/Models/ProductivityItem";
import ServiceIssuedFiscalDocument from "App/Models/ServiceIssuedFiscalDocument";
import TaxationGroup from "App/Models/TaxationGroup";
import TaxationGroupRule, {
	CompanyType,
	MovementCategory,
	MovementType,
} from "App/Models/TaxationGroupRule";
import Treatment from "App/Models/Treatment";
import TreatmentExecution from "App/Models/TreatmentExecution";
import TreatmentItem, { TreatmentItemStatus } from "App/Models/TreatmentItem";
import UfIcms from "App/Models/UfIcms";
import User from "App/Models/User";
import SharedService from "App/Services/SharedService";
import type { AuthContext } from "App/Services/SharedService";
import { GenerateTag } from "App/Utils/GenerateTag";
import type {
	ICreateBillData,
	ICreateBillItemData,
	ICreateBillPaymentData,
	IUpdateBillData,
	IUpdateBillItemData,
} from "Contracts/interfaces/IBillData";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { v4, validate } from "uuid";
import DepositService from "./DepositService";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import PaymentMethodFlag from "App/Models/PaymentMethodFlag";
import ScheduleMovementsService from "./ScheduleMovementsService";
import BillItemDepartment from "App/Models/BillItemDepartment";
import BillAuthorization from "App/Models/BillAuthorization";

interface ISearch {
	fromBill?: string;
	toBill?: string;
	status?: string;
	client?: string;
	clientName?: string;
	patientTag?: string;
	patient?: string;
	patientName?: string;
	tag?: string;
	bill_id?: string;
	pending?: string;
	internalCode?: string;
}

interface ISearchProduct {
	variation?: string;
	reference?: string;
	barcode?: string;
	description?: string;
	quantity?: string;
}

interface ISearchTax {
	origin?: string;
	destination?: string;
	variation?: string;
	type?: string;
	category?: string;
	groups?: Array<string>;
}

@inject()
export default class BillService {
	constructor(
		private sharedService: SharedService,
		private depositService: DepositService,
		private scheduleMovementService: ScheduleMovementsService,
	) {}

	isValidNumber(data: number | undefined) {
		if (!data) {
			return undefined;
		}

		if (typeof data !== "number") {
			return undefined;
		}

		if (data === 0) {
			return undefined;
		}

		return data;
	}

	async index(authCtx: AuthContext, data: ISearch) {
		const qb = Database.from("bills")
			.select(
				Database.raw(`bills.id,
       bills.bill_date,
       bills.total_value,
       bills.internal_code,
       bills.cancelled_at,
       bills.cancelled,
       bills.cancellation_observation,
       case
           when
               (select true
                from bill_items
                where (courtesy = true or max_discount = true)
                  and (approved = false and courtesy_approved_at is not null)
                  and deleted_at is null
                  and bill_items.bill_id = bills.id
                group by bill_id
                union
                select true
                from bill_payments
                where (bill_payments.approved is false)
                  and (bill_payments.approved_at is not null)
                  and bill_payments.deleted_at is null
                  and bill_payments.bill_id = bills.id
                group by bill_id) = true then 'Nao Aprovada'
           else bills.status end as status,
       bills.created_at,
       bills.updated_at,
       bills.tag,
       bills.closing_date,
       bills.paid_value,
       bills.documents_status,
       bills.pending,
       case
           when client_id is not null then
               json_build_object('id', client.id, 'name', client.name, 'type', client.type)
           end                                                   as client,
       case
           when bills.patient_id is not null then
               json_build_object('id', patient.id, 'name', patient.name, 'type', patient.type)
           end                                                   as patient,
       json_build_object('id', seller.id, 'name', seller.name)   as seller,
       json_build_object('id', creator.id, 'name', creator.name) as creator`),
			)
			.joinRaw("join patients client on bills.client_id = client.id")
			.joinRaw("left join patients patient on bills.patient_id = patient.id")
			.joinRaw("join users seller on bills.seller_id = seller.id")
			.joinRaw("join users creator on bills.seller_id = creator.id")
			.orderByRaw("bill_date desc, tag desc")
			.whereRaw("bills.economic_group_id = ? and bills.business_unit_id = ?", [
				authCtx.group.id,
				authCtx.unit.id,
			])
			.whereNull("bills.deleted_at");

		if (data.tag) {
			qb.whereILike("bills.tag", `%${data.tag}%`);
		} else if (data.internalCode) {
			qb.whereILike("internal_code", `%${data.internalCode}%`);
		} else {
			if (data.fromBill) {
				qb.whereRaw("bill_date::date >= ?", [data.fromBill]);
			}

			if (data.toBill) {
				qb.whereRaw("bill_date::date <= ?", [data.toBill]);
			}

			if (data.status) {
				qb.where("status", data.status);
			}

			if (data.client) {
				qb.where("bills.client_id", data.client);
			}

			if (data.patient) {
				qb.where("bills.patient_id", data.patient);
			}

			if (data.patientName) {
				qb.whereRaw("(patient.name ilike ? and patient.type = ?)", [
					`%${data.patientName?.replaceAll(" ", "%")}%`,
					PatientType.ANIMAL,
				]);
			}

			if (data.clientName) {
				qb.whereRaw("(client.name ilike ? and client.type = ?)", [
					`%${data.clientName?.replaceAll(" ", "%")}%`,
					PatientType.TUTOR,
				]);
			}

			if (data.bill_id) {
				qb.where("bills.id", data.bill_id);
			}

			if (data.patientTag) {
				qb.whereRaw("patient_animals.tag = ?", [data.patientTag]);
			}

			if (data.pending === "true") {
				qb.where("pending", true);
			} else if (data.pending === "false") {
				qb.where("pending", false);
			}
		}

		const result = await qb;

		const [count1, count2] = await Promise.all([
			Database.from("issued_fiscal_documents")
				.select(
					Database.raw(
						"issued_fiscal_documents.bill_id, count(issued_fiscal_documents.bill_id)",
					),
				)
				.where("issued_fiscal_documents.business_unit_id", authCtx.unit.id)
				.groupBy("issued_fiscal_documents.bill_id"),
			Database.from("service_issued_fiscal_documents")
				.select(
					Database.raw(
						"service_issued_fiscal_documents.bill_id, count(service_issued_fiscal_documents.bill_id)",
					),
				)
				.where(
					"service_issued_fiscal_documents.business_unit_id",
					authCtx.unit.id,
				)
				.groupBy("service_issued_fiscal_documents.bill_id"),
		]);
		const total = count1.concat(count2);

		return result.map((b) => ({
			hasDocuments: total.findIndex((r) => r.bill_id === b.id) !== -1,
			...b,
		}));
	}

	async show(authCtx: AuthContext, id: string) {
		const bill = await Bill.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("id", id)
			.preload("client", (query) => {
				query.preload("tutor");
			})
			.preload("financialResponsible", (query) => {
				query.select("id", "name");
			})
			.preload("cancelUser", (query) => {
				query.select("id", "name");
			})
			.preload("finishCancelUser", (query) => {
				query.select("id", "name");
			})
			.preload("_cancelReason", (query) => {
				query.select("id", "reason");
			})
			.preload("patient")
			.preload("seller")
			.preload("user")
			.preload("businessUnit")
			.preload("budget", (query) => {
				query.select("id");
			})
			.preload("documents", (query) => {
				query.preload("documentTemplate");
			})
			.preload("payments", (query) => {
				query.orderByRaw("block, bill_payments.installments");

				query.preload("approvedUser", (query) => {
					query.select("id", "name");
				});

				query.preload("acquirer", (query) => {
					query.select("id", "description");
				});

				query.preload("flag", (query) => {
					query.select("id", "description", "code", "type");
				});

				query.preload("paymentMethod");

				query.preload("reviewerCancelUser", (query) => {
					query.select(["id", "name"]);
				});

				query.preload("finance", (q) => {
					q.select(["id", "payment_date", "payment_method_id"]);

					q.preload("paymentMethod", (q) => {
						q.select("id", "description");
					});
				});
			})
			.preload("items", (query) => {
				query.where("status", BillItemStatus.A);

				query.preload("taxRule", (query) => {
					query.select(["id"]);
				});

				query.preload("productVariation", (query) => {
					query.preload("variationOptions");
					query.preload("product");

					query.preload("businessUnitProducts", (query) => {
						query.where("businness_unit_id", authCtx.unit.id);
						query.select("id", "maximum_discount_percentage");
					});
				});

				query.preload("courtesyIssuedUser", (query) => {
					query.select(["id", "name"]);
				});
				query.preload("courtesyApprovedUser", (query) => {
					query.select(["id", "name"]);
				});
				query.preload("reviewerCancelUser", (query) => {
					query.select(["id", "name"]);
				});
			})
			.first();

		if (!bill) {
			throw this.sharedService.ResourceNotFound();
		}

		const rows = await Database.from("bills")
			.select(
				Database.raw(
					`bill_items.id as billitemid,
       pi2.description   as item_produtividade,
       te.treatment_id,
       te.treatment_item_id,
       te.id as treatmentexecutionid,
       te.schedule_date  as data_agendamento,
       te.execution_date as data_execucao,
       te.observations,
       users.name        as usuario_execucao`,
				),
			)
			.joinRaw("join bill_items on bills.id = bill_items.bill_id", [])
			.joinRaw(
				`left join (treatments t
    join treatment_items ti on t.id = ti.treatment_id and t.business_unit_id = ti.business_unit_id
    join treatment_executions te on ti.treatment_id = te.treatment_id and ti.id = te.treatment_item_id
    join productivity_items pi2 on te.productivity_item_id = pi2.id
    left join users on te.execution_user_id = users.id)
                   on bills.business_unit_id = t.business_unit_id and bill_items.bill_id = t.bill_id and
                      ti.bill_item_id = bill_items.id`,
				[],
			)
			.whereRaw("bills.id = ?", [id]);

		const jsonBill = bill.toJSON();

		jsonBill.items = jsonBill.items.map((bi) => {
			bi.treatmentExecutions = rows.filter(
				(ro) => bi.id === ro.billitemid && !!ro.treatment_id,
			);
			return bi;
		});

		return jsonBill;
	}

	async checkItemsDiscount(
		authCtx: AuthContext,
		data: { items: ICreateBillData["items"] },
	) {
		return Database.transaction(async (trx) => {
			const invalid = await this.sharedService.checkDiscount(
				trx,
				authCtx,
				data.items.map((elem) => ({
					variationId: elem.productVariationId,
					unitaryValue: elem.unitaryValue,
					discountValue: elem.discountValue,
					quantity: elem.quantity,
					courtesy: elem.courtesy,
					maxDiscount: elem.maxDiscount,
				})),
			);
			if (invalid.length > 0) {
				return invalid;
			}

			return [];
		});
	}

	async createBill(authCtx: AuthContext, data: ICreateBillData) {
		// if (ufIcms.length !== taxRules.length) {
		//   throw new InternalErrorException(
		//     'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
		//     500,
		//     'E_INTERNAL_ERROR',
		//   );
		// }

		return Database.transaction(async (trx) => {
			if (!data.maxDiscount) {
				const invalid = await this.sharedService.checkDiscount(
					trx,
					authCtx,
					data.items.map((elem) => ({
						variationId: elem.productVariationId,
						unitaryValue: elem.unitaryValue,
						discountValue: elem.discountValue,
						quantity: elem.quantity,
						courtesy: elem.courtesy,
						maxDiscount: elem.maxDiscount,
						approved: elem.approved,
					})),
				);
				if (invalid.length > 0) {
					// return invalid;
					throw new BadRequestException(
						"Desconto máximo foi excedido",
						400,
						"E_ERR",
					);
				}
			}

			if (data.items.length > 0 && authCtx.unit.unitConfig.controlsDeposit) {
				const invalidRows = await this.depositService.validateDepositOperation(
					trx,
					authCtx,
					data.items,
				);

				if (invalidRows.length > 0) {
					// return invalidRows.map((elem) => ({
					// 	rule: "ItemInexistente",
					// 	message: `O produto '${elem.description}' não existe no depósito`,
					// }));
					throw new BadRequestException(
						`Produto(s) não existe no depósito= ${invalidRows.map((r) => r.description).join(" | ")}`,
						400,
						"E_ERR",
					);
				}
			}

			return this.createBillWithTrx(trx, authCtx, data);
		});
	}

	async createBills(authCtx: AuthContext, data: ICreateBillData[]) {
		// if (ufIcms.length !== taxRules.length) {
		//   throw new InternalErrorException(
		//     'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
		//     500,
		//     'E_INTERNAL_ERROR',
		//   );
		// }

		return Database.transaction(async (trx) => {
			const invalid = await this.sharedService.checkDiscount(
				trx,
				authCtx,
				data
					.flatMap((elem) => elem.items)
					.map((elem) => ({
						variationId: elem.productVariationId,
						unitaryValue: elem.unitaryValue,
						discountValue: elem.discountValue,
						quantity: elem.quantity,
						courtesy: elem.courtesy,
						maxDiscount: elem.maxDiscount,
						approved: elem.approved,
					})),
			);
			if (invalid.length > 0) {
				return { valid: false, invalid } as const;
			}

			const tasks = data.map((d) => this.createBillWithTrx(trx, authCtx, d));

			return { valid: true, result: await Promise.all(tasks) } as const;
		});
	}

	async updateBill(authCtx: AuthContext, data: IUpdateBillData) {
		return Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.billId)
				.first();

			if (!bill) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bill.status !== BillStatus.A) {
				throw new BadRequestException(
					"Nota não está aberta",
					400,
					"E_NOT_OPEN",
				);
			}

			if (data.items && !data.maxDiscount) {
				const result = await this.sharedService.checkDiscount(
					trx,
					authCtx,
					data.items.map((elem) => ({
						variationId: elem.productVariationId,
						unitaryValue: elem.unitaryValue,
						discountValue: elem.discountValue,
						quantity: elem.quantity,
						courtesy: elem.courtesy,
						maxDiscount: elem.maxDiscount,
					})),
				);
				if (result.length > 0) {
					// return result;
					throw new BadRequestException(
						"Desconto máximo foi excedido",
						400,
						"E_ERR",
					);
				}
			}

			if (
				data.items &&
				data.items.length > 0 &&
				authCtx.unit.unitConfig.controlsDeposit
			) {
				const invalidRows = await this.depositService.validateDepositOperation(
					trx,
					authCtx,
					data.items.filter((f) => !f.billItemId),
				);

				if (invalidRows.length > 0) {
					throw new BadRequestException(
						`Produto(s) não existe no depósito= ${invalidRows.map((r) => r.description).join(" | ")}`,
						400,
						"E_ERR",
					);
				}
			}

			const tasks = data.items
				? data.items.map(async (elem) => {
						const productVariation = await ProductVariation.query()
							.useTransaction(trx)
							.where("id", elem.productVariationId)
							.whereHas("businessUnitProducts", (query) => {
								query.where("businness_unit_id", authCtx.unit.id);
							})
							.preload("product")
							.preload("businessUnitProducts", (query) => {
								query.where("businness_unit_id", authCtx.unit.id);
							})
							.first();

						if (!productVariation) {
							throw new BadRequestException(
								"Não foi possível encontrar um preço para esse produto",
								400,
								"E_NO_VARIATION",
							);
						}

						if (elem.courtesy && !productVariation.product.courtesy) {
							throw new BadRequestException(
								`Produto '${productVariation.product.description}' não pode ser usado com cortesia`,
								400,
								"E_ERR",
							);
						}

						elem.billItemId
							? await BillItem.query()
									.useTransaction(trx)
									.where("bill_id", bill.id)
									.where("id", elem.billItemId)
									.update({
										courtesy_issued_user_id: elem.courtesy
											? authCtx.user.id
											: undefined, // mantém valor anterior

										courtesy: elem.courtesy,
										max_discount: elem.maxDiscount,
										// saleValue: new Decimal(elem.saleValue ?? 0).toNumber(),
										unitaryValue: elem.courtesy ? 0 : elem.unitaryValue,
										discountValue: elem.courtesy ? 0 : elem.discountValue,
										quantity: new Decimal(elem.quantity).toNumber(),
										totalValue: elem.courtesy
											? 0
											: elem.quantity * elem.unitaryValue - elem.discountValue,
									} as Partial<
										Omit<BillItem, "quantity"> & { quantity: number }
									>)
							: await BillItem.create(
									{
										economic_group_id: authCtx.group.id,
										business_unit_id: authCtx.unit.id,
										product_variation_id: elem.productVariationId,
										courtesy_issued_user_id: elem.courtesy
											? authCtx.user.id
											: null,
										bill_id: bill.id,

										courtesy: elem.courtesy,
										maxDiscount: elem.maxDiscount,
										unitaryValue: elem.courtesy ? 0 : elem.unitaryValue,
										discountValue: elem.courtesy ? 0 : elem.discountValue,
										// saleValue: new Decimal(elem.saleValue ?? 0).toNumber(),
										quantity: new Decimal(elem.quantity),
										totalValue: elem.courtesy
											? 0
											: elem.quantity * elem.unitaryValue - elem.discountValue,
										status: BillItemStatus.A,
									},
									{ client: trx },
								);

						if (elem.departmentId && elem.departmentItemId) {
							if (elem.billItemDepartmentId) {
								await BillItemDepartment.query()
									.useTransaction(trx)
									.where("id", elem.billItemDepartmentId)
									.where("bill_id", data.billId)
									.where(
										"bill_item_id",
										elem.billItemId ? elem.billItemId : v4(),
									)
									.where("department_id", elem.departmentId)
									.where("department_item_id", elem.departmentItemId)
									.update({
										observation: elem.observation,
										updated_user_id: authCtx.user.id,
									});
								// } else {
								// 	await BillItemDepartment.create(
								// 		{
								// 			bill_id: data.billId,
								// 			bill_item_id: Array.isArray(bi)
								// 				? (elem.billItemId ?? v4())
								// 				: bi.id,
								// 			department_id: elem.departmentItemId,
								// 			department_item_id: elem.departmentItemId,
								// 			creation_user_id: authCtx.user.id,
								// 			observation: elem.observation,
								// 		},
								// 		{ client: trx },
								// 	);
							}
						}
					})
				: [];
			await Promise.all(tasks);

			await this.syncBillPendingAndSum(trx, bill);

			await bill
				.merge({
					seller_id: data.sellerId,
					client_id: data.clientId,
					patient_id: data.patientId,
					financial_responsible_id: data.financialResponsibleId,
					additionalInformation: data.additionalInformation,
					internalCode: data.internalCode,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async createBillItem(authCtx: AuthContext, data: ICreateBillItemData) {
		return Database.transaction(async (trx) => {
			if (!data.courtesy) {
				const invalid = await this.sharedService.checkDiscount(trx, authCtx, [
					{
						variationId: data.productVariationId,
						unitaryValue: data.unitaryValue,
						discountValue: data.discountValue,
						quantity: data.quantity,
						courtesy: data.courtesy,
						maxDiscount: data.maxDiscount,
					},
				]);
				if (invalid.length > 0) {
					return invalid;
				}
			}

			const invalidRows = await this.depositService.validateDepositOperation(
				trx,
				authCtx,
				[
					{
						productVariationId: data.productVariationId,
						quantity: data.quantity,
					},
				],
			);

			if (invalidRows.length > 0) {
				return invalidRows.map((elem) => ({
					rule: "ItemInexistente",
					message: `O produto '${elem.description}' não existe no depósito`,
				}));
			}

			return this.createBillItemWithTrx(trx, authCtx, data);
		});
	}

	async createBillItems(authCtx: AuthContext, data: ICreateBillItemData[]) {
		return Database.transaction(async (trx) => {
			const invalid = await this.sharedService.checkDiscount(
				trx,
				authCtx,
				data.map((elem) => ({
					variationId: elem.productVariationId,
					unitaryValue: elem.unitaryValue,
					discountValue: elem.discountValue,
					quantity: elem.quantity,
					courtesy: elem.courtesy,
					maxDiscount: elem.maxDiscount,
				})),
			);

			if (invalid.length > 0) {
				return { valid: false, invalid } as const;
			}

			const invalidRows = await this.depositService.validateDepositOperation(
				trx,
				authCtx,
				data.map((elem) => ({
					productVariationId: elem.productVariationId,
					quantity: elem.quantity,
				})),
			);

			if (invalidRows.length > 0) {
				return {
					valid: false,
					invalid: invalidRows.map((elem) => ({
						rule: "ItemInexistente",
						message: `O produto '${elem.description}' não existe no depósito`,
					})),
				} as const;
			}

			const tasks = data.map((d) =>
				this.createBillItemWithTrx(trx, authCtx, d),
			);

			return { valid: true, result: await Promise.all(tasks) } as const;
		});
	}

	async updateBillItem(authCtx: AuthContext, data: IUpdateBillItemData) {
		return Database.transaction(async (trx) => {
			const billItems = await BillItem.query()
				.whereIn(
					"id",
					data.items.map((i) => i.billItemId),
				)
				.where("status", BillItemStatus.A)
				.preload("taxRule")
				.preload("bill", (query) => {
					query.preload("items");
				})
				.preload("productVariation", (query) => {
					query.preload("product");
				});

			if (billItems.at(0)?.bill.status !== BillStatus.A) {
				throw new BadRequestException(
					"Nota não está aberta",
					400,
					"E_NOT_OPEN",
				);
			}

			const invalid: { rule: string; message: string }[] =
				await this.sharedService.checkDiscount(
					trx,
					authCtx,
					data.items
						.filter((f) => f.shouldValidateDiscount)
						.map((elem) => {
							const item = billItems.find((bi) => bi.id === elem.billItemId);
							if (!item) {
								throw new InternalErrorException(
									"Atualização de item não encontrado?",
									500,
									"E_ERR",
								);
							}

							return {
								variationId: item.product_variation_id,
								quantity: item.quantity.toNumber(),
								unitaryValue: elem.unitaryValue,
								discountValue: elem.discountValue,
								courtesy: elem.courtesy,
								maxDiscount: elem.maxDiscount,
							};
						}),
				);
			if (invalid.length > 0) {
				return invalid;
			}

			const ufList = billItems.map((i) => i.taxRule?.toUf).filter(Boolean);
			const ufIcms = await UfIcms.query()
				.useTransaction(trx)
				.where("origin_uf", ufList)
				.where("destination_uf", ufList)
				.first();

			const promises = billItems.map(async (billItem) => {
				const dataItem = data.items.find((i) => i.billItemId === billItem.id);
				if (!dataItem) {
					throw new InternalErrorException(
						"Erro procurando item da nota",
						400,
						"E_RR",
					);
				}

				const totalValue = billItem.quantity
					.times(dataItem.unitaryValue)
					.minus(dataItem.discountValue ?? 0)
					.toNumber();

				const icmsBase =
					totalValue *
					((100 - (billItem.taxRule?.icmsPercRedBaseCalculo ?? 0)) / 100);
				const icmsStBase_1 =
					icmsBase + (icmsBase * (billItem.taxRule?.ivaIcmsSt ?? 1)) / 100;
				const icmsStPercentageRedBase = this.isValidNumber(
					billItem.taxRule?.ivaIcmsSt,
				)
					? (billItem.taxRule?.icmsPercRedBaseCalculo ?? 0)
					: undefined;
				const icmsStBase_2 = this.isValidNumber(billItem.taxRule?.ivaIcmsSt)
					? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
					: 0;
				const icmsValue = (icmsBase * (billItem.taxRule?.icmsPerc ?? 1)) / 100;

				return billItem
					.merge({
						courtesy_issued_user_id:
							dataItem.courtesy || dataItem.maxDiscount
								? billItem.courtesy_approved_user_id || authCtx.user.id
								: null,
						courtesy: dataItem?.courtesy ?? false,
						maxDiscount: dataItem?.maxDiscount ?? false,
						discountValue: dataItem?.discountValue ?? 0,
						unitaryValue: dataItem.unitaryValue,
						totalValue,
						icmsOriginProduct: billItem.productVariation.product.icmsOrigin,
						icmsCst: billItem.taxRule?.icmsCst,
						icmsBase:
							billItem.productVariation.product.type === ProductType.PRODUCT
								? icmsBase
								: undefined,
						icmsPercentage:
							billItem.productVariation.product.type === ProductType.PRODUCT
								? billItem.taxRule?.icmsPerc
								: undefined,
						icmsValue:
							billItem.productVariation.product.type === ProductType.PRODUCT
								? icmsValue
								: undefined,
						icmsPercentageRedAliquot: billItem?.taxRule?.icmsPercRedAliquota,
						icmsPercentageRedBase: billItem?.taxRule?.icmsPercRedBaseCalculo,
						icmsStBase: this.isValidNumber(billItem?.taxRule?.ivaIcmsSt)
							? icmsStBase_2
							: undefined,
						icmsStPercentageRedBase: this.isValidNumber(
							billItem.taxRule?.ivaIcmsSt,
						)
							? (billItem.taxRule?.icmsPercRedBaseCalculo ?? 0)
							: undefined,
						icmsStIva: this.isValidNumber(billItem?.taxRule?.ivaIcmsSt),
						icmsStPercentageUfDestination: this.isValidNumber(
							billItem.taxRule?.ivaIcmsSt,
						)
							? ufIcms?.icmsPercentage
							: undefined,
						icmsStValue:
							ufIcms && this.isValidNumber(billItem?.taxRule?.ivaIcmsSt)
								? icmsStBase_2 * (ufIcms.icmsPercentage / 100) - icmsValue
								: undefined,
						issCst:
							billItem.productVariation.product.type === ProductType.SERVICE
								? billItem?.taxRule?.icmsCst
								: undefined,
						issBase:
							billItem.productVariation.product.type === ProductType.SERVICE
								? icmsBase
								: undefined,
						issPercentage:
							billItem.productVariation.product.type === ProductType.SERVICE
								? billItem?.taxRule?.icmsPerc
								: undefined,
						issValue:
							billItem.productVariation.product.type === ProductType.SERVICE
								? (icmsBase * (billItem?.taxRule?.icmsPerc ?? 0)) / 100
								: undefined,
						pisCst: billItem.taxRule?.pisCst,
						cofinsCst: billItem.taxRule?.cofinsCst,
						pisBase: totalValue,
						pisPercentage: billItem.taxRule?.pisPerc,
						pisValue: (totalValue * (billItem.taxRule?.pisPerc ?? 1)) / 100,
						pisRetentionValue: 0,
						cofinsBase: totalValue,
						cofinsPercentage: billItem.taxRule?.cofinsPerc,
						cofinsValue:
							(totalValue * (billItem.taxRule?.cofinsPerc ?? 1)) / 100,
						cofinsRetentionValue: 0,
						ipiCst: billItem.taxRule?.ipiCst,
						ipiBase: totalValue,
						ipiPercentage: billItem.taxRule?.ipiPerc,
						ipiValue: (totalValue * (billItem.taxRule?.ipiPerc ?? 2)) / 100,
						icmsDeferredValue: 0,
						icmsPartitionValue: 0,
						icmsFcpPercentage: billItem.taxRule?.fcpPerc,
						icmsFcpValue: (icmsBase * (billItem.taxRule?.fcpPerc ?? 1)) / 100,
						icmsPartitionOriginUfPercentage: billItem.taxRule?.icmsPerc,
						icmsPartitionDestinationUfPercentage:
							billItem.taxRule?.icmsPercRedAliquota,
						icmsPartitionInterUfPercentage:
							billItem.taxRule?.icmsPercRedAliquota,
					})
					.useTransaction(trx)
					.save();
			});
			const result = await Promise.all(promises);

			const billId = result.at(0)?.bill_id;
			if (!billId) {
				return;
			}

			const bill = await Bill.findOrFail(billId, {
				client: trx,
			});

			const validItems = await BillItem.query()
				.useTransaction(trx)
				.where("bill_id", billId)
				.where("status", BillItemStatus.A)
				.preload("taxRule")
				.preload("productVariation", (query) => query.preload("product"));

			await this.syncBillPendingAndSum(trx, bill);

			await bill
				.merge({
					icmsBase: validItems.reduce((acc, item) => acc + item.icmsBase, 0),
					icmsValue: validItems.reduce((acc, item) => acc + item.icmsValue, 0),
					icmsStBase: validItems
						.filter(
							(i) =>
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
						)
						.reduce((acc, item) => acc + item.icmsStBase, 0),
					icmsStValue: validItems
						.filter(
							(i) =>
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
						)
						.reduce((acc, item) => acc + item.icmsStValue, 0),
					issBase: validItems.reduce(
						(acc, item) => acc + (item.issBase ?? 0),
						0,
					),
					issValue: validItems.reduce((acc, item) => acc + item.issValue, 0),
					pisBase: validItems.reduce((acc, item) => acc + item.pisBase, 0),
					pisValue: validItems.reduce((acc, item) => acc + item.pisValue, 0),
					pisRetentionValue: validItems.reduce(
						(acc, item) => acc + (item.pisRetentionValue ?? 0),
						0,
					),
					cofinsBase: validItems.reduce(
						(acc, item) => acc + item.cofinsBase,
						0,
					),
					cofinsValue: validItems.reduce(
						(acc, item) => acc + item.cofinsValue,
						0,
					),
					cofinsRetentionValue: validItems.reduce(
						(acc, item) => acc + item.cofinsRetentionValue,
						0,
					),
					ipiBase: validItems.reduce((acc, item) => acc + item.ipiBase, 0),
					ipiValue: validItems.reduce((acc, item) => acc + item.ipiValue, 0),
					icmsDeferredValue: validItems.reduce(
						(acc, item) => acc + item.icmsDeferredValue,
						0,
					),
					icmsFcpValue: validItems.reduce(
						(acc, item) => acc + item.icmsFcpValue,
						0,
					),
					icmsUfDestinationValue: validItems.reduce(
						(acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
						0,
					),
					icmsUfOriginValue: validItems.reduce(
						(acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
						0,
					),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async deleteBillItem(authCtx: AuthContext, id: string) {
		return Database.transaction(async (trx) => {
			const billItem = await BillItem.query()
				.useTransaction(trx)
				.where("id", id)
				.first();

			if (!billItem) {
				throw this.sharedService.ResourceNotFound();
			}

			if (billItem.status === BillItemStatus.I) {
				throw new BadRequestException("Item já removido", 400, "E_ERR");
			}

			await billItem
				.merge({
					exclusion_user_id: authCtx.user.id,

					status: BillItemStatus.I,
					deleted_at: DateTime.now(),
				})
				.useTransaction(trx)
				.save();

			const bill = await Bill.findOrFail(billItem.bill_id, {
				client: trx,
			});
			if (bill.status !== BillStatus.A) {
				throw new BadRequestException(
					"Nota não está aberta",
					400,
					"E_NOT_OPEN",
				);
			}

			const validItems = await BillItem.query()
				.useTransaction(trx)
				.where("bill_id", billItem.bill_id)
				.where("status", BillItemStatus.A)
				.preload("taxRule")
				.preload("productVariation", (query) => query.preload("product"));

			await this.syncBillPendingAndSum(trx, bill);

			await bill
				.merge({
					icmsBase: validItems.reduce((acc, item) => acc + item.icmsBase, 0),
					icmsValue: validItems.reduce((acc, item) => acc + item.icmsValue, 0),
					icmsStBase: validItems
						.filter(
							(i) =>
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
						)
						.reduce((acc, item) => acc + item.icmsStBase, 0),
					icmsStValue: validItems
						.filter(
							(i) =>
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
						)
						.reduce((acc, item) => acc + item.icmsStValue, 0),
					issBase: validItems.reduce(
						(acc, item) => acc + (item.issBase ?? 0),
						0,
					),
					issValue: validItems.reduce((acc, item) => acc + item.issValue, 0),
					pisBase: validItems.reduce((acc, item) => acc + item.pisBase, 0),
					pisValue: validItems.reduce((acc, item) => acc + item.pisValue, 0),
					pisRetentionValue: validItems.reduce(
						(acc, item) => acc + (item.pisRetentionValue ?? 0),
						0,
					),
					cofinsBase: validItems.reduce(
						(acc, item) => acc + item.cofinsBase,
						0,
					),
					cofinsValue: validItems.reduce(
						(acc, item) => acc + item.cofinsValue,
						0,
					),
					cofinsRetentionValue: validItems.reduce(
						(acc, item) => acc + item.cofinsRetentionValue,
						0,
					),
					ipiBase: validItems.reduce((acc, item) => acc + item.ipiBase, 0),
					ipiValue: validItems.reduce((acc, item) => acc + item.ipiValue, 0),
					icmsDeferredValue: validItems.reduce(
						(acc, item) => acc + item.icmsDeferredValue,
						0,
					),
					icmsFcpValue: validItems.reduce(
						(acc, item) => acc + item.icmsFcpValue,
						0,
					),
					icmsUfDestinationValue: validItems.reduce(
						(acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
						0,
					),
					icmsUfOriginValue: validItems.reduce(
						(acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
						0,
					),
				})
				.useTransaction(trx)
				.save();

			await Database.rawQuery(
				`update deposit_items
set quantity = quantity + ?
where deposit_id = ?
  and product_variation_id = ?`,
				[
					billItem.quantity.toNumber(),
					billItem.deposit_id,
					billItem.product_variation_id,
				],
			)
				.useTransaction(trx)
				.exec();

			await Database.rawQuery(
				"update bill_item_departments set deleted_at = now(), deleted_user_id = ? where bill_item_id = ?",
				[authCtx.user.id, id],
			)
				.useTransaction(trx)
				.exec();
		});
	}

	async createBillPayment(authCtx: AuthContext, data: ICreateBillPaymentData) {
		return Database.transaction(async (trx) => {
			const bill = await Bill.findOrFail(data.billId, {
				client: trx,
			});

			if (bill.status !== BillStatus.A) {
				throw new BadRequestException(
					"Nota não está aberta",
					400,
					"E_NOT_OPEN",
				);
			}

			const paymentMethod = await PaymentMethod.query()
				.useTransaction(trx)
				.where("id", data.paymentMethodId)
				.firstOrFail();

			const solidInstallments = data.installments ?? 1;
			let pendingBillPayment = false;
			if (data.paymentMethodFlagId) {
				const paymentMethodFlag = await PaymentMethodFlag.query()
					.useTransaction(trx)
					.where("id", data.paymentMethodFlagId)
					.firstOrFail();

				if (solidInstallments > paymentMethodFlag.maxInstallments) {
					throw new BadRequestException(
						"Numero de parcelas é Superior ao permitido pela forma de pagamento",
						400,
						"E_ERR",
					);
				}

				if (
					solidInstallments >
					(paymentMethodFlag.installmentsWithoutPassword ?? 0)
				) {
					if (data.maxParcelas) {
						pendingBillPayment = true;
					} else {
						throw new BadRequestException(
							"Esta Venda ficará pendente de liberação pois o Numero de Parcelas lançado exige liberação. Deseja enviar para aprovação?",
							400,
							"E_ERR",
						);
					}
				}
			} else {
				if (solidInstallments > paymentMethod.maxInstallments) {
					throw new BadRequestException(
						"Numero de parcelas é Superior ao permitido pela forma de pagamento",
						400,
						"E_ERR",
					);
				}

				if (
					solidInstallments > (paymentMethod.installmentsWithoutPassword ?? 0)
				) {
					if (data.maxParcelas) {
						pendingBillPayment = true;
					} else {
						throw new BadRequestException(
							"Esta Venda ficará pendente de liberação pois o Numero de Parcelas lançado exige liberação. Deseja enviar para aprovação?",
							400,
							"E_ERR",
						);
					}
				}
			}

			const dailyCashier =
				authCtx.unit.unitConfig.dailyCashierType === "usuario"
					? await DailyCashier.query()
							.useTransaction(trx)
							.where("business_unit_id", authCtx.unit.id)
							.where("user_who_opened_id", authCtx.user.id)
							.where("status", DailyCashierStatus.A)
							.whereRaw("opening_date::date = now()::date")
							.first()
					: await DailyCashier.query()
							.useTransaction(trx)
							.where("business_unit_id", authCtx.unit.id)
							.where("status", DailyCashierStatus.A)
							.whereRaw("opening_date::date = now()::date")
							.first();

			if (!dailyCashier) {
				throw new BadRequestException(
					authCtx.unit.unitConfig.dailyCashierType === "usuario"
						? "Não existe caixa aberto para o seu login na data de hoje"
						: "Não existe caixa aberto na data de hoje",
					400,
					"E_NOT_OPEN",
				);
			}

			const installment = data.paymentMethodFlagInstallmentId
				? await PaymentMethodFlagInstallment.query()
						.useTransaction(trx)
						.where("id", data.paymentMethodFlagInstallmentId)
						.firstOrFail()
				: { fee: paymentMethod.fee, installment: data.installments ?? 1 };

			const existingPayments = await BillPayment.query().where(
				"bill_id",
				bill.id,
			);

			const max =
				existingPayments.length > 0
					? Math.max(...existingPayments.map((p) => p.block))
					: 0;

			const singleValue =
				Math.floor((data.installmentsValue / installment.installment) * 100) /
				100;
			const withOffset =
				data.installmentsValue - singleValue * (installment.installment - 1);

			const payments = await BillPayment.createMany(
				Array.from(
					{ length: installment.installment ?? 1 },
					(_, v) => {
						const installmentValue =
							v === installment.installment - 1 ? withOffset : singleValue;

						return {
							economic_group_id: authCtx.group.id,
							business_unit_id: authCtx.unit.id,
							bill_id: bill.id,
							payment_method_id: data.paymentMethodId,
							tef_acquirer_id: data.acquirerId,
							tef_flag_id: data.flagId,
							daily_cashier_id: dailyCashier.id,
							budget_payment_id: data.budgetPaymentId,

							pending: data.maxParcelas && pendingBillPayment,
							block: max + 1,
							expirationDate: SharedService.CalculateDateOffset(
								v,
								data.expirationDate,
								paymentMethod,
							),
							feeType:
								paymentMethod.fee > 0
									? BillPaymentFeeType.S
									: BillPaymentFeeType.N,
							feeValue: 0,
							feePercentage: 0,
							installments: v + 1,
							installmentValue,
							totalValue: installmentValue, // TODO: add fee
							nsuDocument: data.nsuDocument,
							paymentMethodDiscountPercentage: installment.fee,
							paymentMethodDiscountValue:
								(installmentValue * installment.fee) / 100,
							qtyInstallments: data.installments,
						};
					},
					{
						client: trx,
					},
				),
			);

			await bill
				.merge({
					paidValue: bill.paidValue + data.installmentsValue,
					pending: pendingBillPayment || bill.pending,
				})
				.useTransaction(trx)
				.save();

			if (data.budgetPaymentId) {
				await BudgetPayment.query()
					.useTransaction(trx)
					.where("id", data.budgetPaymentId)
					.whereHas("budget", (query) => {
						query.where("bill_id", data.billId);
					})
					.update({
						conclusion_user_id: authCtx.user.id,
						confirmationDate: DateTime.now(),
						block_ref: max + 1,
						status: "Baixado",
					} as Partial<BudgetPayment>);
			}

			const $checkingAccountMeta =
				await BusinessUnitCheckingAccountPaymentMethod.query()
					.useTransaction(trx)
					.where("business_unit_id", authCtx.unit.id)
					.where("payment_method_id", data.paymentMethodId)
					.first();

			await Finance.createMany(
				Array.from({ length: installment.installment }, (_, v) => {
					const installmentValue =
						v === installment.installment - 1 ? withOffset : singleValue;

					return {
						user_id: authCtx.user.id,
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						daily_movement_id: bill.daily_movement_id,
						daily_cashier_id: bill.daily_cashier_id,
						client_id: bill.financial_responsible_id ?? bill.client_id,
						payment_method_id: paymentMethod.id,
						origin_id: payments.at(v)?.id,
						account_plan_id: authCtx.unit.unitConfig.sale_exit_account_plan_id,
						checking_account_id:
							$checkingAccountMeta?.checking_account_id ??
							paymentMethod.checkingAccountId,

						internalCode: bill.internalCode,
						type: FinanceType.C,
						installment: v + 1,
						block: max + 1,
						originFlag: FinanceOriginFlag.S,
						document: `NFS-${bill.tag}`,
						historic: `NFS-${bill.tag}`,
						issueDate: DateTime.now(),
						discountValue: 0,
						discountPercentage: 0,
						expirationDate: payments.at(v)?.expirationDate,
						originalValue: installmentValue,
						value:
							installmentValue - (installmentValue * installment.fee) / 100,
						totalValue:
							installmentValue - (installmentValue * installment.fee) / 100,
						feeDiscountValue:
							(payments.at(v)?.installmentValue ?? 0) -
							(installmentValue - (installmentValue * installment.fee) / 100),
						feeValue: 0,
						// feeDiscountPercentage: paymentMethod.fee,
						feeDiscountPercentage:
							payments.at(v)?.paymentMethodDiscountPercentage,
						accept: FinanceAccept.N,
						reconciled: authCtx.unit.unitConfig.balanceControl === "previsto",
						competenceDate: DateTime.now().toFormat("MM/yyyy"),
						nsuDocument: payments.at(v)?.nsuDocument,
						tef_flag_id: payments.at(v)?.tef_flag_id,
						acquirer_id: payments.at(v)?.tef_acquirer_id,
						status: FinanceStatus.A,
						qtyInstallments: data.installments,
					};
				}),
				{
					client: trx,
				},
			);

			await this.syncBillPendingAndSum(trx, bill);

			return payments.map((elem) => ({
				billId: elem.bill_id,
				block: elem.block,
			}));
		});
	}

	async deleteBillPayment(authCtx: AuthContext, id: string) {
		await Database.transaction(async (trx) => {
			const payment = await BillPayment.query()
				.useTransaction(trx)
				.where("id", id)
				.preload("bill")
				.first();

			if (!payment || payment.bill.economic_group_id !== authCtx.group.id) {
				throw this.sharedService.ResourceNotFound();
			}

			if (payment.bill.status !== BillStatus.A) {
				throw new BadRequestException(
					"Nota não está aberta",
					400,
					"E_NOT_OPEN",
				);
			}

			const finances = await Finance.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("origin_flag", FinanceOriginFlag.S)
				.whereILike("document", `%NFS-${payment.bill.tag}%`)
				.where("block", payment.block);
			if (finances.some((p) => p.status === FinanceStatus.B)) {
				throw new BadRequestException(
					"Já foi dado baixa em algum pagamento",
					400,
					"E_ERR",
				);
			}

			await Finance.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("origin_flag", FinanceOriginFlag.S)
				.whereILike("document", `%NFS-${payment.bill.tag}%`)
				.where("block", payment.block)
				.where("origin_id", payment.id)
				.update({
					exclusion_user_id: authCtx.user.id,
					deleted_at: DateTime.now(),
					status: FinanceStatus.E,
				});

			await payment.useTransaction(trx).delete();

			await this.syncBillPendingAndSum(trx, payment.bill);

			await payment.bill
				.merge({
					paidValue: payment.bill.paidValue - payment.totalValue,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async deleteBillPaymentBlock(
		authCtx: AuthContext,
		data: { billId: string; block: number },
	) {
		await Database.transaction(async (trx) => {
			const payments = await BillPayment.query()
				.useTransaction(trx)
				.where("bill_id", data.billId)
				.where("block", data.block)
				.whereHas("bill", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				})
				.preload("bill");

			if (payments.length === 0) {
				throw new BadRequestException(
					"Nenhum pagamento encontrado",
					400,
					"E_NOT_FOUND",
				);
			}

			const bill = payments.find((p) => !!p.bill)?.bill as Bill;

			if (payments.some((p) => p.bill.status !== BillStatus.A)) {
				throw new BadRequestException(
					"Nota não aberta encontrada",
					400,
					"E_NOT_OPEN",
				);
			}

			const finances = await Finance.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("origin_flag", FinanceOriginFlag.S)
				.whereIn(
					"document",
					payments.map((p) => `NFS-${p.bill.tag}`),
				)
				.where("block", data.block)
				.whereIn(
					"origin_id",
					payments.map((p) => p.id),
				);
			if (finances.some((p) => p.status === FinanceStatus.B)) {
				throw new BadRequestException(
					"Já foi dado baixa em algum pagamento",
					400,
					"E_ERR",
				);
			}

			await Finance.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("origin_flag", FinanceOriginFlag.S)
				.whereIn(
					"document",
					payments.map((p) => `NFS-${p.bill.tag}`),
				)
				.where("block", data.block)
				.whereIn(
					"origin_id",
					payments.map((p) => p.id),
				)
				.update({
					exclusion_user_id: authCtx.user.id,
					deleted_at: new Date(),
					status: FinanceStatus.E,
				});

			await BillPayment.query()
				.useTransaction(trx)
				.where("bill_id", data.billId)
				.where("block", data.block)
				.whereHas("bill", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				})
				.delete();

			await this.syncBillPendingAndSum(trx, bill);

			await bill
				.merge({
					paidValue:
						bill.paidValue -
						payments.reduce((acc, curr) => acc + curr.totalValue, 0),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async searchProducts(unitId: string, data: ISearchProduct) {
		const today = DateTime.now();

		const group = await this.sharedService.getUserGroup(unitId);

		const qb = Product.query()
			.orderByRaw("description asc")
			.where("economic_group_id", group.id)
			.whereNotIn("purpose", [ProductPurpose.INTERNAL])
			.where("active", true);

		if (data.variation || data.barcode || data.quantity) {
			qb.whereHas("variations", (query) => {
				if (data.variation) {
					query.where("id", data.variation);
				}
				if (data.barcode) {
					query.where("barcode", "ilike", `%${data.barcode}%`);
				}

				if (data.quantity) {
					query.whereHas("businessUnitProducts", (query) => {
						query.where("businness_unit_id", unitId);

						if (data.quantity) {
							query.where("stock", ">=", data.quantity);
						}
					});
				}
			});
		}

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.reference) {
			qb.where("referenceCode", "ilike", `%${data.reference}%`);
		}

		qb.preload("variations", (query) => {
			query.where("active", true);
			query.preload("variationOptions");
			query.preload("product");

			query.preload("kitItems", (query) => {
				query.whereHas("kit", (query) => {
					qb.whereRaw("(from_expiration >= ? or from_expiration is null)", [
						today.startOf("day").toISO()!,
					]);
					qb.whereRaw("(from_expiration <= ? or from_expiration is null)", [
						today.endOf("day").toISO()!,
					]);

					query.where("active", true);
				});

				query.preload("kit", (query) => {
					qb.whereRaw("(from_expiration >= ? or from_expiration is null)", [
						today.startOf("day").toISO()!,
					]);
					qb.whereRaw("(from_expiration <= ? or from_expiration is null)", [
						today.endOf("day").toISO()!,
					]);

					query.preload("items", (query) => {
						query.where("business_unit_id", unitId);

						query.preload("productVariation");
					});
				});
			});
			query.preload("businessUnitProducts", (query) => {
				query.where("businness_unit_id", unitId);
			});
		});
		qb.preload("unit");

		const products = await qb;

		const kits = await Kit.query()
			.where("economic_group_id", group.id)
			.whereRaw("(to_expiration <= ? or to_expiration is null)", [
				today.endOf("day").toISO()!,
			])
			.whereRaw("(from_expiration >= ? or from_expiration is null)", [
				today.startOf("day").toISO()!,
			]);
		// const kits = await Kit.query()
		//   .where('economic_group_id', group.id)
		//   .preload('items', query => {
		//     query.preload('productVariation', query => {
		//       query.whereHas('businessUnitProducts', query => {
		//         query.where('businness_unit_id', unitId);
		//       });

		//       query.preload('product');
		//       query.preload('businessUnitProducts', query => {
		//         query.where('businness_unit_id', unitId);
		//       });
		//     });
		//   });

		return [
			...products,
			...kits.map((elem) => ({ ...elem.toJSON(), type: "kit" })),
		];
	}

	async searchTax(unitId: string, data: ISearchTax) {
		const group = await this.sharedService.getUserGroup(unitId);

		const qb = TaxationGroup.query()
			.where("economic_group_id", group.id)
			.where("active", true);

		if (data.origin) {
			qb.whereHas("rules", (query) => {
				query.where("from_uf", data.origin as string);
			});
		}

		if (data.destination) {
			qb.whereHas("rules", (query) => {
				query.where("to_uf", data.destination as string);
			});
		}

		if (data.type) {
			qb.whereHas("rules", (query) => {
				query.where("movement_type", data.type as string);
			});
		}

		if (data.category) {
			qb.whereHas("rules", (query) => {
				query.where("movement_category", data.category as string);
			});
		}

		if (data.groups) {
			qb.whereHas("rules", (query) => {
				query.whereIn("taxation_group_id", data.groups ?? []);
			});
		}

		qb.preload("rules", (query) => {
			query.preload("taxOperation");

			query.where("active", true);

			if (data.origin) {
				query.where("from_uf", data.origin);
			}

			if (data.destination) {
				query.where("to_uf", data.destination);
			}

			if (data.type) {
				query.where("movement_type", data.type);
			}

			if (data.category) {
				query.where("movement_category", data.category);
			}

			if (data.groups) {
				query.whereIn("taxation_group_id", data.groups);
			}
		});

		const result = await qb;

		return result.flatMap((tax) => tax.rules);
	}

	async closeBill(unitId: string, user: User, id: string) {
		const group = await this.sharedService.getUserGroup(unitId);

		const bill = await Bill.query()
			.where("economic_group_id", group.id)
			.where("id", id)
			.preload("payments")
			.preload("items")
			.first();

		if (!bill) {
			throw this.sharedService.ResourceNotFound();
		}

		if (bill.status !== BillStatus.A) {
			throw new BadRequestException(
				"Apenas notas de saídas abertas podem ser fechadas",
				400,
				"E_NOT_OPEN",
			);
		}

		if (bill.paidValue < bill.totalValue) {
			throw new BadRequestException(
				"Valor de pagamentos é menor que o valor da nota",
				400,
				"E_NOT_OPEN",
			);
		}

		if (
			bill.items.some(
				(i) =>
					(i.courtesy || i.maxDiscount) &&
					(!i.approved || !i.courtesy_approved_user_id),
			)
		) {
			throw new BadRequestException(
				"Venda não pode ser finalizada pois possui cortesias não aprovadas",
				400,
				"E_ERR",
			);
		}

		if (bill.pending) {
			throw new BadRequestException(
				"Esta Venda possui pendencias de Cortesia/Desconto Máximo que precisam ser aprovadas antes de ser finalizada",
				400,
				"E_ERR",
			);
		}

		// const dailyCashier = await DailyCashier.query()
		//   .where('business_unit_id', unitId)
		//   .where('user_who_opened_id', user.id)
		//   .where('status', DailyCashierStatus.A)
		//   .first();
		// if (!dailyCashier) {
		//   throw new BadRequestException(
		//     'Usuário não tem caixa diário aberto',
		//     400,
		//     'E_NOT_OPEN',
		//   );
		// }

		await Database.transaction(async (trx) => {
			await bill
				.merge({
					user_who_closed_id: user.id,
					closingDate: DateTime.now(),
					status: BillStatus.B,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async excludeBill(authCtx: AuthContext, id: string) {
		await Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.preload("items", (query) => {
					query.where("status", BillItemStatus.A);
				})
				// .preload("payments")
				.first();

			if (!bill) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bill.status === BillStatus.EX) {
				throw new BadRequestException("Venda já excluída", 400, "E_ERR");
			}

			const rows = await Database.from("bills")
				.select("id")
				.where("origin_bill_id", bill.id);
			if (rows.length > 0) {
				throw new BadRequestException(
					"Esta venda não pode ser excluida pois foi utilizada como Referencia para outras vendas",
					400,
					"E_ERR",
				);
			}

			// if (bill.payments.length > 0) {
			// 	throw new BadRequestException(
			// 		"Venda possui pagamentos lançados. Para exclui-la é necessário excluir todos os pagamentos",
			// 		400,
			// 		"E_ERR",
			// 	);
			// }

			await bill
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
					status: BillStatus.EX,
				})
				.useTransaction(trx)
				.save();

			await BillItem.query()
				.useTransaction(trx)
				.update({
					deleted_at: DateTime.now(),
				})
				.whereNull("deleted_at")
				.where("bill_id", bill.id);

			await Finance.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("origin_flag", FinanceOriginFlag.S)
				.whereILike("document", `%NFS-${bill.tag}%`)
				// .where("block", payment.block)
				// .where("origin_id", payment.id)
				.update({
					deleted_at: DateTime.now(),
					status: FinanceStatus.E,
				});

			await BillPayment.query()
				.useTransaction(trx)
				.where("bill_id", bill.id)
				.delete();

			if (bill.items.length > 0) {
				const tasks = bill.items.map(async (item) => {
					return Database.rawQuery(
						`update deposit_items
set quantity = quantity + ?
where deposit_id = ?
  and product_variation_id = ?`,
						[
							item.quantity.toNumber(),
							item.deposit_id,
							item.product_variation_id,
						],
					)
						.useTransaction(trx)
						.exec();
				});

				await Promise.all(tasks);
			}
		});
	}

	async reopenBill(unitId: string, _: User, id: string) {
		const group = await this.sharedService.getUserGroup(unitId);

		const bill = await Bill.query()
			.where("economic_group_id", group.id)
			.where("id", id)
			.first();

		if (!bill) {
			throw this.sharedService.ResourceNotFound();
		}

		if (bill.status !== BillStatus.B) {
			throw new BadRequestException(
				"Apenas notas de saídas fechadas podem ser abertas",
				400,
				"E_NOT_CLOSED",
			);
		}

		await bill
			.merge({
				user_who_closed_id: undefined,
				closingDate: undefined,
				status: BillStatus.A,
			})
			.save();
	}

	async disableBillItem(unitId: string, id: string) {
		const group = await this.sharedService.getUserGroup(unitId);

		const item = await BillItem.query().where("id", id).preload("bill").first();

		if (!item || item.bill.economic_group_id !== group.id) {
			throw this.sharedService.ResourceNotFound();
		}

		await Database.transaction(async (trx) => {
			await item
				.merge({
					status: BillItemStatus.I,
					disabledAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();

			const validItems = await BillItem.query()
				.whereNot("id", id)
				.where("status", BillItemStatus.A)
				.preload("productVariation", (query) => {
					query.preload("product");
				});

			let totalProductValue = 0;
			let totalServiceValue = 0;
			validItems.forEach((item) => {
				if (item.productVariation.product.type === ProductType.PRODUCT) {
					totalProductValue += item.totalValue;
				}
				if (item.productVariation.product.type === ProductType.SERVICE) {
					totalServiceValue += item.totalValue;
				}
			});

			// const totalProductValue = validItems.reduce(
			//   (acc, item) => acc + item.totalValue,
			//   0,
			// );

			const totalDiscountValue = validItems.reduce(
				(acc, item) => acc + item.discountValue,
				0,
			);

			await item.bill
				.merge({
					productValue: totalProductValue,
					serviceValue: totalServiceValue,
					discountValue: totalDiscountValue,
					totalValue: totalProductValue + totalServiceValue,
					icmsBase: validItems.reduce((acc, item) => acc + item.icmsBase, 0),
					icmsValue: validItems.reduce((acc, item) => acc + item.icmsValue, 0),
					icmsStBase: validItems
						.filter(
							(i) =>
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
						)
						.reduce((acc, item) => acc + item.icmsStBase, 0),
					icmsStValue: validItems
						.filter(
							(i) =>
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
						)
						.reduce((acc, item) => acc + item.icmsStValue, 0),
					issBase: validItems.reduce((acc, item) => acc + item.issBase, 0),
					issValue: validItems.reduce((acc, item) => acc + item.issValue, 0),
					pisBase: validItems.reduce((acc, item) => acc + item.pisBase, 0),
					pisValue: validItems.reduce((acc, item) => acc + item.pisValue, 0),
					pisRetentionValue: validItems.reduce(
						(acc, item) => acc + item.pisRetentionValue,
						0,
					),
					cofinsBase: validItems.reduce(
						(acc, item) => acc + item.cofinsBase,
						0,
					),
					cofinsValue: validItems.reduce(
						(acc, item) => acc + item.cofinsValue,
						0,
					),
					cofinsRetentionValue: validItems.reduce(
						(acc, item) => acc + item.cofinsRetentionValue,
						0,
					),
					ipiBase: validItems.reduce((acc, item) => acc + item.ipiBase, 0),
					ipiValue: validItems.reduce((acc, item) => acc + item.ipiValue, 0),
					icmsDeferredValue: validItems.reduce(
						(acc, item) => acc + item.icmsDeferredValue,
						0,
					),
					icmsFcpValue: validItems.reduce(
						(acc, item) => acc + item.icmsFcpValue,
						0,
					),
					icmsUfDestinationValue: validItems.reduce(
						(acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
						0,
					),
					icmsUfOriginValue: validItems.reduce(
						(acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
						0,
					),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async recalculateItemsTaxes(unitId: string, id: string) {
		await Database.transaction(async (trx) => {
			const unit = await BusinessUnit.findOrFail(id, {
				client: trx,
			});

			const bill = await Bill.query()
				.useTransaction(trx)
				.where("business_unit_id", unitId)
				.where("id", id)
				.preload("items", (query) => {
					query.preload("productVariation", (query) => {
						query.preload("product");
					});
				})
				.preload("client", (query) => {
					query.preload("tutor");
				})
				.first();

			if (!bill) {
				throw this.sharedService.ResourceNotFound();
			}

			const itemsWithoutTaxes = bill.items.filter((i) => !i.tax_rule_id);
			if (itemsWithoutTaxes.length > 0) {
				const productVariations = await ProductVariation.query()
					.useTransaction(trx)
					.whereIn(
						"id",
						itemsWithoutTaxes.map((i) => i.product_variation_id),
					)
					.preload("product")
					.preload("businessUnitProducts", (query) => {
						query.where("businness_unit_id", unitId);
					});

				const taxRules = await TaxationGroupRule.query()
					.useTransaction(trx)
					.whereHas("taxationGroup", (query) => {
						query.whereIn(
							"id",
							productVariations.map((item) => item.product.taxation_group_id),
						);
					})
					.where("movementType", MovementType.S)
					.where("movementCategory", MovementCategory.NS)
					.where("fromUf", unit.state ?? "")
					.where("toUf", unit.state ?? "")
					.preload("taxationGroup")
					.preload("taxOperation");

				const ufIcms = await UfIcms.query()
					.whereIn(
						"origin_uf",
						taxRules.map((rule) => rule.toUf),
					)
					.whereIn(
						"destination_uf",
						taxRules.map((rule) => rule.toUf),
					);

				itemsWithoutTaxes.forEach(async (item) => {
					const rule = taxRules.find(
						(rule) =>
							rule.taxationGroup.id ===
							item.productVariation.product.taxation_group_id,
					);

					if (rule) {
						const ufIcmsRule = ufIcms.find(
							(ufIcms) =>
								ufIcms.originUf === rule.fromUf &&
								ufIcms.destinationUf === rule.toUf,
						);

						const totalValue = item.quantity
							.times(item.unitaryValue)
							.minus(item.discountValue)
							.toNumber();
						const icmsBase =
							totalValue * ((100 - (rule.icmsPercRedBaseCalculo ?? 0)) / 100);
						const icmsStBase_1 = icmsBase + (icmsBase * rule.ivaIcmsSt) / 100;
						const icmsStPercentageRedBase = rule.ivaIcmsSt
							? rule.icmsPercRedBaseCalculoST
							: undefined;
						const icmsStBase_2 = rule.ivaIcmsSt
							? icmsStBase_1 -
								(icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
							: 0;
						const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;

						await item
							.merge({
								tax_rule_id: rule.id,
								fiscalOperationCode: rule.taxOperation.code,
								icmsCst: rule.icmsCst,
								icmsBase,
								icmsPercentage: rule.icmsPerc,
								icmsValue,
								icmsPercentageRedAliquot: rule.icmsPercRedAliquota,
								icmsPercentageRedBase: rule.icmsPercRedBaseCalculo,
								icmsStPercentageUfDestination: rule?.ivaIcmsSt
									? ufIcmsRule?.icmsPercentage
									: undefined,
								icmsStBase: rule.ivaIcmsSt ? icmsStBase_2 : undefined,
								icmsStPercentageRedBase,
								icmsStIva: rule.ivaIcmsSt,
								icmsStValue: rule.ivaIcmsSt
									? icmsStBase_2 * ((ufIcmsRule?.icmsPercentage ?? 100) / 100) -
										icmsValue
									: undefined,
								issBase: rule.icmsPerc,
								issValue: (icmsBase * (rule.icmsPerc ?? 0)) / 100,
								issPercentage: rule.icmsPerc,
								pisPercentage: rule.pisPerc,
								cofinsPercentage: rule.cofinsPerc,
								ipiPercentage: rule.ipiPerc,
								icmsFcpPercentage: rule.fcpPerc,
								icmsPartitionOriginUfPercentage: rule.icmsPerc,
								icmsPartitionDestinationUfPercentage: rule.icmsPercRedAliquota,
								icmsPartitionInterUfPercentage: rule.icmsPercRedAliquota,
							})
							.useTransaction(trx)
							.save();
					}
				});
			}
		});
	}

	async createBillWithTrx(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		data: ICreateBillData,
	) {
		if (authCtx.unit.unitConfig.requiresBillPatient && !data.patientId) {
			throw new BadRequestException(
				"É necessário informar o paciente para realizar o orçamento",
				400,
				"E_ERR",
			);
		}

		const existingBillWithInternalCode = await Bill.query()
			.useTransaction(trx)
			.where("business_unit_id", authCtx.unit.id)
			.whereRaw("internal_code ilike ?", [`%${data.internalCode ?? v4()}%`])
			.first();

		let dynamicInternalCode = data.internalCode;
		if (data.internalCode && existingBillWithInternalCode) {
			if (!data.originBillId) {
				throw new BadRequestException(
					`Código '${data.internalCode}' já está sendo usado pela venda '${existingBillWithInternalCode.tag}', e não é possível repetir.`,
					400,
					"E_ERR",
				);
			}

			const count = await Bill.query()
				.useTransaction(trx)
				.select("id")
				.where("business_unit_id", authCtx.unit.id)
				.whereRaw("internal_code ilike ?", [`${data.internalCode}%`]);
			dynamicInternalCode = `${data.internalCode} / ${count.length.toString().padStart(3, "0")}`;
		}

		// const client = await Patient.query()
		//   .useTransaction(trx)
		//   .where('id', data.clientId)
		//   .preload('tutor')
		//   .firstOrFail();
		//
		const client = await Patient.query()
			.useTransaction(trx)
			.where("id", data.clientId)
			.preload("bills")
			.firstOrFail();
		if (client.bills.length === 0) {
			await client
				.merge({
					firstSale: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		}

		if (data.patientId) {
			const patient = await Patient.query()
				.useTransaction(trx)
				.where("id", data.patientId)
				.preload("bills")
				.firstOrFail();
			if (patient.bills.length === 0) {
				await patient
					.merge({
						firstSale: DateTime.now(),
					})
					.useTransaction(trx)
					.save();
			}
		}

		await Patient.query()
			.useTransaction(trx)
			.whereIn("id", [client.id, data.patientId].filter(Boolean) as string[])
			.update({
				lastSale: DateTime.now(),
			});

		const productVariations = await ProductVariation.query()
			.useTransaction(trx)
			.whereIn(
				"id",
				data.items.map((item) => item.productVariationId),
			)
			.preload("product")
			.preload("businessUnitProducts", (query) => {
				query.where("businness_unit_id", authCtx.unit.id);
			});

		for (const item of data.items.filter((i) => i.courtesy)) {
			const variation = productVariations.find(
				(v) => v.id === item.productVariationId,
			);

			if (!variation) {
				throw new InternalErrorException(
					"Produto enviado não foi encontrado",
					500,
					"E_ERR",
				);
			}

			if (item.courtesy && !variation.product.courtesy) {
				throw new BadRequestException(
					`Produto '${variation.product.description}' não pode ser usado com cortesia`,
					400,
					"E_ERR",
				);
			}
		}

		const taxRules = await TaxationGroupRule.query()
			.useTransaction(trx)
			.whereHas("taxationGroup", (query) => {
				query.whereIn(
					"id",
					productVariations.map((item) => item.product.taxation_group_id),
				);
			})
			.where("movement_type", MovementType.S)
			.where("movement_category", MovementCategory.NS)
			.where("fromUf", authCtx.unit.state ?? "")
			.where("toUf", authCtx.unit.state ?? "")
			.where(
				"company_type",
				authCtx.unit.simple ? CompanyType.S : CompanyType.N,
			)
			.preload("taxationGroup")
			.preload("taxOperation");

		const ufIcms = await UfIcms.query()
			.whereIn(
				"origin_uf",
				taxRules.map((rule) => rule.toUf),
			)
			.whereIn(
				"destination_uf",
				taxRules.map((rule) => rule.toUf),
			);

		const dailyCashier = await this.sharedService.getContextCashier(
			authCtx,
			trx,
			false,
		);

		const bill = await Bill.create(
			{
				economic_group_id: authCtx.group.id,
				business_unit_id: authCtx.unit.id,
				user_id: authCtx.user.id,
				seller_id: authCtx.user.id,
				daily_movement_id: data.dailyMovementId,
				daily_cashier_id: dailyCashier?.id,
				budget_id: data.budgetId,
				financial_responsible_id: data.financialResponsibleId ?? data.clientId,
				client_id: data.clientId,
				patient_id: data.patientId,
				origin_bill_id: data.originBillId,

				internalCode: dynamicInternalCode,
				pending: data.items.some((i) => i.courtesy || i.maxDiscount),
				billDate: data.billDate,
				productValue: 0,
				serviceValue: 0,
				discountValue: 0,
				totalValue: 0,
				deliveryValue: 0,
				additionalInformation: data.additionalInformation,
				status: BillStatus.A,
				documentStatus: "Não Gerados",

				otherValue: 0,
				tag: GenerateTag(
					Number.parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1,
				),
			},
			{
				client: trx,
			},
		);

		if (data.scheduleId) {
			await this.scheduleMovementService.createScheduleMovements(authCtx, [
				{
					scheduleId: data.scheduleId,
					type: "bill",
					movementId: bill.id,
				},
			]);
		}

		await authCtx.unit.unitConfig
			.merge({
				billCounter: (
					Number.parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1
				).toString(),
			})
			.useTransaction(trx)
			.save();

		await Database.from("user_unit_roles")
			.useTransaction(trx)
			.select(
				Database.raw(
					"coalesce(user_unit_roles.default_sale_deposit_id, business_unit_configs.outgoing_deposit_id) as deposit_id",
				),
			)
			.joinRaw(
				"join business_unit_configs on user_unit_roles.unit_id = business_unit_configs.business_unit_id",
			)
			.where("user_unit_roles.user_id", authCtx.user.id)
			.where("user_unit_roles.unit_id", authCtx.unit.id);

		const tasks = data.items.map(async (item) => {
			const variation = productVariations.find(
				(variation) => variation.id === item.productVariationId,
			) as ProductVariation;

			const rule = taxRules.find(
				(rule) => rule.taxationGroup.id === variation.product.taxation_group_id,
			);

			const price = variation.businessUnitProducts.find(
				(bup) => bup.businness_unit_id === authCtx.unit.id,
			);

			const ufIcmsRule = ufIcms.find(
				(ufIcms) =>
					ufIcms.originUf === rule?.toUf && ufIcms.destinationUf === rule?.toUf,
			);

			const totalValue = item.unitaryValue * item.quantity - item.discountValue;
			const icmsBase =
				totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
			const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;
			const icmsStBase_1 = this.isValidNumber(rule?.ivaIcmsSt)
				? icmsBase + (icmsBase * rule!.ivaIcmsSt) / 100
				: 0;
			const icmsStPercentageRedBase = this.isValidNumber(rule?.ivaIcmsSt)
				? rule!.icmsPercRedBaseCalculoST
				: undefined;
			const icmsStBase_2 = this.isValidNumber(rule?.ivaIcmsSt)
				? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
				: 0;

			const bi = await BillItem.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					bill_id: bill.id,
					product_variation_id: item.productVariationId,
					tax_rule_id: rule?.id,
					deposit_id: undefined,
					courtesy_issued_user_id:
						item.courtesy || item.maxDiscount ? authCtx.user.id : undefined,

					courtesy: item.courtesy,
					maxDiscount: item.maxDiscount,
					quantity: new Decimal(item.quantity),
					costValue: price?.costPrice,
					saleValue: price?.price,
					unitaryValue: item.courtesy ? 0 : item.unitaryValue,
					discountValue: item.courtesy ? 0 : item.discountValue,
					totalValue: item.courtesy ? 0 : totalValue,
					status: BillItemStatus.A,
					// createdAt: bill.createdAt,

					fiscalOperationCode: rule?.taxOperation.code,
					icmsOriginProduct: variation.product.icmsOrigin,
					icmsCst:
						variation.product.type === ProductType.PRODUCT
							? rule?.icmsCst
							: undefined,
					icmsBase:
						variation.product.type === ProductType.PRODUCT
							? icmsBase
							: undefined,
					icmsPercentage:
						variation.product.type === ProductType.PRODUCT
							? rule?.icmsPerc
							: undefined,
					icmsValue:
						variation.product.type === ProductType.PRODUCT
							? icmsValue
							: undefined,
					icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
					icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
					icmsStBase: this.isValidNumber(rule?.ivaIcmsSt)
						? icmsStBase_2
						: undefined,
					icmsStPercentageRedBase: this.isValidNumber(rule?.ivaIcmsSt)
						? rule?.icmsPercRedBaseCalculoST
						: undefined,
					icmsStIva: this.isValidNumber(rule?.ivaIcmsSt),
					icmsStPercentageUfDestination: this.isValidNumber(rule?.ivaIcmsSt)
						? ufIcmsRule?.icmsPercentage
						: undefined,
					icmsStValue: this.isValidNumber(rule?.ivaIcmsSt)
						? icmsStBase_2 * ((ufIcmsRule?.icmsPercentage ?? 100) / 100) -
							icmsValue
						: undefined,
					issCst:
						variation.product.type === ProductType.SERVICE
							? rule?.icmsCst
							: undefined,
					issBase:
						variation.product.type === ProductType.SERVICE
							? icmsBase
							: undefined,
					issPercentage:
						variation.product.type === ProductType.SERVICE
							? rule?.icmsPerc
							: undefined,
					issValue:
						variation.product.type === ProductType.SERVICE
							? (icmsBase * (rule?.icmsPerc ?? 0)) / 100
							: undefined,
					pisCst: rule?.pisCst,
					cofinsCst: rule?.cofinsCst,
					pisBase: totalValue,
					pisPercentage: rule?.pisPerc,
					pisValue: (totalValue * (rule?.pisPerc ?? 1)) / 100,
					pisRetentionValue: 0,
					cofinsBase: totalValue,
					cofinsPercentage: rule?.cofinsPerc,
					cofinsValue: (totalValue * (rule?.cofinsPerc ?? 1)) / 100,
					cofinsRetentionValue: 0,
					ipiCst: rule?.ipiCst,
					ipiBase: totalValue,
					ipiPercentage: rule?.ipiPerc,
					ipiValue: (totalValue * (rule?.ipiPerc ?? 1)) / 100,
					icmsDeferredValue: 0,
					icmsPartitionValue: 0,
					icmsFcpPercentage: rule?.fcpPerc,
					icmsFcpValue: (icmsBase * (rule?.fcpPerc ?? 0)) / 100,
					icmsPartitionOriginUfPercentage: rule?.icmsPerc,
					icmsPartitionDestinationUfPercentage: rule?.icmsPercRedAliquota,
					icmsPartitionInterUfPercentage: rule?.icmsPercRedAliquota,
				},
				{
					client: trx,
				},
			);

			if (item.departmentId && item.departmentItemId) {
				await BillItemDepartment.create(
					{
						bill_id: bill.id,
						bill_item_id: bi.id,
						department_id: item.departmentId,
						department_item_id: item.departmentId,
						creation_user_id: authCtx.user.id,

						observation: item.observation,
						createdAt: DateTime.now(),
					},
					{
						client: trx,
					},
				);
			}
		});

		await Promise.all(tasks);

		const existingItems = await BillItem.query()
			.useTransaction(trx)
			.where("bill_id", bill.id)
			.whereRaw("(courtesy is false or max_discount is false)")
			.preload("productVariation", (query) => {
				query.preload("product");
			});

		await this.syncBillPendingAndSum(trx, bill);

		await bill
			.merge({
				icmsBase: existingItems
					.filter((i) => Boolean(i.icmsBase))
					.reduce((acc, item) => acc + (item.icmsBase ?? 0), 0),
				icmsValue: existingItems
					.filter((i) => Boolean(i.icmsValue))
					.reduce((acc, item) => acc + item.icmsValue, 0),
				icmsStBase: existingItems
					.filter(
						(i) =>
							typeof i.icmsStValue === "number" && !Number.isNaN(i.icmsStValue),
					)
					.reduce((acc, item) => acc + item.icmsStBase, 0),
				icmsStValue: existingItems
					.filter(
						(i) =>
							typeof i.icmsStValue === "number" && !Number.isNaN(i.icmsStValue),
					)
					.reduce((acc, item) => acc + (item.icmsStValue ?? 0), 0),
				issBase: existingItems.reduce(
					(acc, item) => acc + (item.issBase ?? 0),
					0,
				),
				issValue: existingItems.reduce(
					(acc, item) => acc + (item.issValue ?? 0),
					0,
				),
				pisBase: existingItems.reduce(
					(acc, item) => acc + (item.pisBase ?? 0),
					0,
				),
				pisValue: existingItems.reduce(
					(acc, item) => acc + (item.pisValue ?? 0),
					0,
				),
				pisRetentionValue: existingItems.reduce(
					(acc, item) => acc + (item.pisRetentionValue ?? 0),
					0,
				),
				cofinsBase: existingItems.reduce(
					(acc, item) => acc + (item.cofinsBase ?? 0),
					0,
				),
				cofinsValue: existingItems.reduce(
					(acc, item) => acc + (item.cofinsValue ?? 0),
					0,
				),
				cofinsRetentionValue: existingItems.reduce(
					(acc, item) => acc + (item.cofinsRetentionValue ?? 0),
					0,
				),
				ipiBase: existingItems.reduce(
					(acc, item) => acc + (item.ipiBase ?? 0),
					0,
				),
				ipiValue: existingItems.reduce(
					(acc, item) => acc + (item.ipiValue ?? 0),
					0,
				),
				icmsDeferredValue: existingItems.reduce(
					(acc, item) => acc + (item.icmsDeferredValue ?? 0),
					0,
				),
				icmsFcpValue: existingItems.reduce(
					(acc, item) => acc + (item.icmsFcpValue ?? 0),
					0,
				),
				icmsUfDestinationValue: existingItems.reduce(
					(acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
					0,
				),
				icmsUfOriginValue: existingItems.reduce(
					(acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
					0,
				),
			})
			.useTransaction(trx)
			.save();

		await this.depositService.updateDepositItems(trx, authCtx, bill.id);

		return bill;
	}

	async createBillItemWithTrx(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		data: ICreateBillItemData & { kitId?: number },
	) {
		const bill = await Bill.query()
			.useTransaction(trx)
			.where("id", data.billId)
			.preload("client", (query) => {
				query.preload("tutor");
			})
			.firstOrFail();
		await bill
			.merge({ documentStatus: "Novos Itens" })
			.useTransaction(trx)
			.save();

		const productVariation = await ProductVariation.query()
			.useTransaction(trx)
			.where("id", data.productVariationId)
			.whereHas("businessUnitProducts", (query) => {
				query.where("businness_unit_id", authCtx.unit.id);
			})
			.preload("product")
			.preload("businessUnitProducts", (query) => {
				query.where("businness_unit_id", authCtx.unit.id);
			})
			.first();
		if (!productVariation) {
			throw new BadRequestException(
				"Não foi possível encontrar um preço para esse produto",
				400,
				"E_NO_VARIATION",
			);
		}

		if (data.courtesy && !productVariation.product.courtesy) {
			throw new BadRequestException(
				`Produto '${productVariation.product.description}' não pode ser usado com cortesia`,
				400,
				"E_ERR",
			);
		}

		const rule = await TaxationGroupRule.query()
			.useTransaction(trx)
			.whereHas("taxationGroup", (query) => {
				query.where("id", productVariation.product.taxation_group_id);
			})
			.where("movementType", MovementType.S)
			.where("movementCategory", MovementCategory.NS)
			.where("fromUf", authCtx.unit.state ?? "")
			.where("toUf", authCtx.unit.state ?? "")
			.where(
				"company_type",
				authCtx.unit.simple ? CompanyType.S : CompanyType.N,
			)
			.preload("taxationGroup")
			.preload("taxOperation")
			.first();

		// if (!rule) {
		//   throw new BadRequestException(
		//     'Não existe regra de imposto válida',
		//     400,
		//     'E_NO_RULE',
		//   );
		// }

		const ufIcms = await UfIcms.query()
			.useTransaction(trx)
			.where("origin_uf", rule?.toUf ?? "-")
			.where("destination_uf", rule?.toUf ?? "-")
			.first();
		// if (!ufIcms) {
		//   throw new InternalErrorException(
		//     'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
		//     500,
		//     'E_INTERNAL_ERROR',
		//   );
		// }

		const [price] = productVariation.businessUnitProducts;
		if (!price) {
			throw new InternalErrorException(
				"Não foi possível encontrar um preço para esse produto",
				500,
				"E_INTERNAL_ERROR",
			);
		}

		const [{ deposit_id }] = await Database.from("user_unit_roles")
			.useTransaction(trx)
			.select(
				Database.raw(
					"coalesce(user_unit_roles.default_sale_deposit_id, business_unit_configs.outgoing_deposit_id) as deposit_id",
				),
			)
			.joinRaw(
				"join business_unit_configs on user_unit_roles.unit_id = business_unit_configs.business_unit_id",
			)
			.where("user_unit_roles.user_id", authCtx.user.id)
			.where("user_unit_roles.unit_id", authCtx.unit.id);

		const totalValue = data.unitaryValue * data.quantity - data.discountValue;
		const icmsBase =
			totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
		const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;
		const icmsStBase_1 = icmsBase + (icmsBase * (rule?.ivaIcmsSt ?? 0)) / 100;
		const icmsStPercentageRedBase = rule?.ivaIcmsSt
			? rule?.icmsPercRedBaseCalculoST
			: undefined;
		const icmsStBase_2 = rule?.ivaIcmsSt
			? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
			: 0;

		let toCreate: Partial<BillItem> = {
			economic_group_id: authCtx.group.id,
			business_unit_id: authCtx.unit.id,
			bill_id: bill.id,
			product_variation_id: data.productVariationId,
			tax_rule_id: rule?.id,
			kit_id: data.kitId,
			deposit_id,
			courtesy_issued_user_id:
				data.courtesy || data.maxDiscount ? authCtx.user.id : undefined,

			courtesy: data.courtesy,
			maxDiscount: data.maxDiscount,
			quantity: new Decimal(data.quantity),
			costValue: price.costPrice,
			saleValue: price.price,
			unitaryValue: data.unitaryValue,
			discountValue: data.discountValue,
			totalValue,
			status: BillItemStatus.A,

			fiscalOperationCode: rule?.taxOperation?.code,

			issCst:
				productVariation.product.type === ProductType.SERVICE
					? rule?.icmsCst
					: undefined,
			issBase:
				productVariation.product.type === ProductType.SERVICE
					? icmsBase
					: undefined,
			issPercentage:
				productVariation.product.type === ProductType.SERVICE
					? rule?.icmsPerc
					: undefined,
			issValue:
				productVariation.product.type === ProductType.SERVICE
					? (icmsBase * (rule?.icmsPerc ?? 0)) / 100
					: undefined,
			pisCst: rule?.pisCst,
			pisBase: totalValue,
			pisPercentage: rule?.pisPerc,
			pisValue: (totalValue * (rule?.pisPerc ?? 1)) / 100,
			pisRetentionValue: 0,
			cofinsCst: rule?.cofinsCst,
			cofinsBase: totalValue,
			cofinsPercentage: rule?.cofinsPerc,
			cofinsValue: (totalValue * (rule?.cofinsPerc ?? 1)) / 100,
			cofinsRetentionValue: 0,
			ipiCst: rule?.ipiCst,
			ipiBase: totalValue,
			ipiPercentage: rule?.ipiPerc,
			ipiValue: (totalValue * (rule?.ipiPerc ?? 1)) / 100,

			// icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,

			icmsOriginProduct: productVariation.product.icmsOrigin,
			icmsCst:
				productVariation.product.type === ProductType.PRODUCT
					? rule?.icmsCst
					: undefined,

			icmsFcpPercentage: rule?.fcpPerc,
			icmsFcpValue: (icmsBase * (rule?.fcpPerc ?? 1)) / 100,
		};

		if (
			productVariation.product.type === ProductType.PRODUCT &&
			rule?.icmsCst
		) {
			const cst = rule.icmsCst;

			if (["00", "10", "20", "70", "90", "900"].includes(cst)) {
				toCreate = Object.assign(toCreate, {
					icmsBase:
						productVariation.product.type === ProductType.PRODUCT
							? icmsBase
							: undefined,
					icmsPercentage:
						productVariation.product.type === ProductType.PRODUCT
							? rule?.icmsPerc
							: undefined,
					icmsValue:
						productVariation.product.type === ProductType.PRODUCT
							? icmsValue
							: undefined,
				});
			}

			if (["10", "30", "70", "90", "201", "202", "203", "900"].includes(cst)) {
				toCreate = Object.assign(toCreate, {
					icmsStBase: this.isValidNumber(rule?.ivaIcmsSt)
						? icmsStBase_2
						: undefined,
					icmsStPercentageRedBase: this.isValidNumber(rule?.ivaIcmsSt)
						? rule?.icmsPercRedBaseCalculoST
						: undefined,
					icmsStIva: this.isValidNumber(rule?.ivaIcmsSt),
					icmsStPercentageUfDestination: this.isValidNumber(rule?.ivaIcmsSt)
						? ufIcms?.icmsPercentage
						: undefined,
					icmsStValue:
						this.isValidNumber(rule?.ivaIcmsSt) && ufIcms
							? icmsStBase_2 * (ufIcms.icmsPercentage / 100) - icmsValue
							: undefined,
				});
			}

			if (["20", "70", "90", "900"].includes(cst)) {
				toCreate = Object.assign(toCreate, {
					icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
				});
			}

			if (["51"].includes(cst)) {
				toCreate = Object.assign(toCreate, {
					icmsDeferredOperationValue: icmsValue,
					icmsDeferredPercentage: rule.icmsPercDiferimento,
					icmsDeferredValue: icmsBase * (rule.icmsPercDiferimento / 100),
					icmsValue:
						((rule.icmsPerc - rule.icmsPercDiferimento) * icmsBase) / 100,
				});
			}
		}

		// icmsPartitionValue: 0,
		// icmsPartitionOriginUfPercentage: rule?.icmsPerc,
		// icmsPartitionDestinationUfPercentage: rule?.icmsPercRedAliquota,
		// icmsPartitionInterUfPercentage: rule?.icmsPercRedAliquota,

		await BillItem.create(toCreate, {
			client: trx,
		});

		const validItems = await bill
			.related("items")
			.query()
			.useTransaction(trx)
			.where("status", BillItemStatus.A)
			.whereRaw("(courtesy is false or max_discount is false)")
			.preload("productVariation", (query) => {
				query.preload("product");
			});

		await this.syncBillPendingAndSum(trx, bill);

		await bill
			.merge({
				icmsBase: validItems.reduce((acc, item) => acc + item.icmsBase, 0),
				icmsValue: validItems.reduce((acc, item) => acc + item.icmsValue, 0),
				icmsStBase: validItems
					.filter(
						(i) =>
							typeof i.icmsStValue === "number" && !Number.isNaN(i.icmsStValue),
					)
					.reduce((acc, item) => acc + item.icmsStBase, 0),
				icmsStValue: validItems
					.filter(
						(i) =>
							typeof i.icmsStValue === "number" && !Number.isNaN(i.icmsStValue),
					)
					.reduce((acc, item) => acc + item.icmsStValue, 0),
				issBase: validItems.reduce((acc, item) => acc + (item.issBase ?? 0), 0),
				issValue: validItems.reduce((acc, item) => acc + item.issValue, 0),
				pisBase: validItems.reduce((acc, item) => acc + item.pisBase, 0),
				pisValue: validItems.reduce((acc, item) => acc + item.pisValue, 0),
				pisRetentionValue: validItems.reduce(
					(acc, item) => acc + (item.pisRetentionValue ?? 0),
					0,
				),
				cofinsBase: validItems.reduce((acc, item) => acc + item.cofinsBase, 0),
				cofinsValue: validItems.reduce(
					(acc, item) => acc + item.cofinsValue,
					0,
				),
				cofinsRetentionValue: validItems.reduce(
					(acc, item) => acc + item.cofinsRetentionValue,
					0,
				),
				ipiBase: validItems.reduce((acc, item) => acc + item.ipiBase, 0),
				ipiValue: validItems.reduce((acc, item) => acc + item.ipiValue, 0),
				icmsDeferredValue: validItems.reduce(
					(acc, item) => acc + item.icmsDeferredValue,
					0,
				),
				icmsFcpValue: validItems.reduce(
					(acc, item) => acc + item.icmsFcpValue,
					0,
				),
				icmsUfDestinationValue: validItems.reduce(
					(acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
					0,
				),
				icmsUfOriginValue: validItems.reduce(
					(acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
					0,
				),
			})
			.useTransaction(trx)
			.save();
	}

	public async addFromKit(
		authCtx: AuthContext,
		data: {
			billId: string;
			kitId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.useTransaction(trx)
				.where("id", data.billId)
				.andWhere("business_unit_id", authCtx.unit.id)
				.first();

			if (!bill) {
				throw this.sharedService.ResourceNotFound();
			}

			if (bill.status !== BillStatus.A) {
				throw new BadRequestException(
					"Nota de Saída não está aberto",
					400,
					"E_ERR",
				);
			}

			const kit = await Kit.query()
				.useTransaction(trx)
				.where("id", data.kitId)
				.andWhere("economic_group_id", authCtx.group.id)
				.preload("items", (query) => {
					query.where("business_unit_id", authCtx.unit.id);

					query.preload("productVariation", (query) => {
						query.preload("product");
					});
				})
				.first();

			if (!kit) {
				throw this.sharedService.ResourceNotFound();
			}

			if (!kit.active) {
				throw new BadRequestException("Kit não está ativo", 400, "E_ERR");
			}

			await Promise.all(
				kit.items.map(async (item) =>
					this.createBillItemWithTrx(trx, authCtx, {
						billId: data.billId,
						quantity: item.quantity,
						discountValue: item.discountPrice,
						productVariationId: item.product_variation_id,
						unitaryValue: item.originalPrice,
					}),
				),
			);
		});
	}

	async fetchConferenceCashier(authCtx: AuthContext, id: string) {
		return Database.transaction(async (trx) => {
			const cashier = await DailyCashier.query()
				.useTransaction(trx)
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!cashier) {
				throw this.sharedService.ResourceNotFound();
			}

			const bills = await Bill.query()
				.useTransaction(trx)
				.where("daily_cashier_id", cashier.id)
				.preload("client")
				.preload("payments", (query) => {
					query.preload("paymentMethod");
					query.preload("flag");
				});

			return bills.flatMap((elem) =>
				elem.payments.map((payment) => ({
					id: payment.id,
					description: payment.paymentMethod.description,
					flag: payment.flag.description,
					operation: payment.paymentMethod.tef,
					client: {
						id: elem.client?.id,
						name: elem.client?.name,
					},
					tag: elem.tag,
					nsuDocument: payment.nsuDocument,
					total: payment.totalValue,
					expiresAt: payment.expirationDate,
					createdAt: payment.createdAt,
				})),
			);
		});
	}

	async updateCashierConference(
		authCtx: AuthContext,
		data: {
			dailyCashierId: string;
			confirmedPayments: string[];
		},
	) {
		return Database.transaction(async (trx) => {
			const cashier = await DailyCashier.query()
				.useTransaction(trx)
				.where("id", data.dailyCashierId)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!cashier) {
				throw this.sharedService.ResourceNotFound();
			}

			const payments = await BillPayment.query()
				.useTransaction(trx)
				.where("daily_cashier_id", cashier.id);

			const tasks = payments.map((elem) => {
				const isConfirmed = data.confirmedPayments.includes(elem.id);

				return elem
					.merge({
						user_id: isConfirmed ? authCtx.user.id : undefined,
						conferenceDate: isConfirmed ? DateTime.now() : undefined,
					})
					.useTransaction(trx)
					.save();
			});
			const updatedPayments = await Promise.all(tasks);
			const confirmedPayments = updatedPayments.filter(
				(elem) => elem.conferenceDate,
			);

			const finances = await Finance.query()
				.useTransaction(trx)
				.whereIn(
					"origin_id",
					confirmedPayments.map((elem) => elem.id),
				);

			const tasks2 = finances.map((elem) =>
				elem
					.merge({
						accept: FinanceAccept.S,
						acceptedDate: DateTime.now(),
					})
					.useTransaction(trx)
					.save(),
			);
			await Promise.all(tasks2);
		});
	}

	async updatePaymentExpiration(
		authCtx: AuthContext,
		data: {
			billPaymentId: string;
			expirationDate: DateTime;
		}[],
	) {
		return Database.transaction(async (trx) => {
			const payments = await BillPayment.query()
				.useTransaction(trx)
				.preload("finance")
				.where("business_unit_id", authCtx.unit.id)
				.whereIn(
					"id",
					data.map((elem) => elem.billPaymentId),
				);

			if (payments.length !== data.length) {
				throw new BadRequestException(
					"Algum pagamento não foi encontrado",
					400,
					"E_NO_PAYMENTS",
				);
			}

			if (payments.some((p) => p?.finance?.status === FinanceStatus.B)) {
				throw new BadRequestException(
					"Algum pagamento já foi baixado",
					400,
					"E_DOWN",
				);
			}

			const tasks = payments.map((elem) => {
				const payment = data.find((p) => p.billPaymentId === elem.id);

				return elem
					.merge({
						expirationDate: payment?.expirationDate,
					})
					.useTransaction(trx)
					.save();
			});
			const updatedPayments = await Promise.all(tasks);

			const finances = await Finance.query()
				.useTransaction(trx)
				.whereIn(
					"origin_id",
					updatedPayments.map((elem) => elem.id),
				);

			const tasks2 = finances.map((elem) =>
				elem
					.merge({
						expirationDate:
							updatedPayments.find((p) => p.id === elem.origin_id)
								?.expirationDate ?? elem.expirationDate,
					})
					.useTransaction(trx)
					.save(),
			);
			await Promise.all(tasks2);
		});
	}

	async createTreatmentFromBill(
		authCtx: AuthContext,
		data: { billId: string; sellerId: string },
	) {
		await Database.transaction(async (trx) => {
			const elem = await Bill.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.billId)
				.preload("items")
				.first();

			if (!elem) {
				throw this.sharedService.ResourceNotFound();
			}

			if (elem.treatment_id) {
				throw new BadRequestException(
					"Está venda já foi convertida em tratamento",
					400,
					"E_ERR",
				);
			}

			const treatment = await Treatment.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					bill_id: elem.id,
					emission_user_id: authCtx.user.id,
					client_id: elem.client_id,
					seller_id: data.sellerId,

					emissionDate: DateTime.now(),
					status: "Confirmado",
				},
				{ client: trx },
			);

			await elem
				.merge({
					treatment_id: treatment.id,
				})
				.useTransaction(trx)
				.save();

			const treatmentItems = await TreatmentItem.createMany(
				elem.items.map((inner, index) => ({
					id: index + 1,
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					treatment_id: treatment.id,
					product_variation_id: inner.product_variation_id,
					bill_item_id: inner.id,

					status: TreatmentItemStatus[0],
					quantity: new Decimal(inner.quantity).toNumber(),
				})),
				{ client: trx },
			);

			const services = await Product.query()
				.useTransaction(trx)
				.where("type", ProductType.SERVICE)
				.whereHas("variations", (query) => {
					query.whereIn(
						"id",
						elem.items.map((i) => i.product_variation_id),
					);
				})
				.preload("variations", (query) => {
					query.whereIn(
						"id",
						elem.items.map((i) => i.product_variation_id),
					);
				});

			const productivityItems = await ProductivityItem.query()
				.useTransaction(trx)
				.whereHas("products", (query) => {
					query.whereIn(
						"product_id",
						services.map((p) => p.id),
					);
				})
				.preload("products", (query) => {
					query.whereIn(
						"product_id",
						services.map((p) => p.id),
					);
				});

			let execCounter = 1;
			const tasks2 = treatmentItems.map((elem) => {
				const product = services.find(
					(p) =>
						p.variations.find((v) => v.id === elem.product_variation_id)?.id,
				);
				const relatedItems = productivityItems.filter((p) =>
					p.products.some((p) => p.product_id === (product?.id ?? "")),
				);

				const innerTasks = relatedItems.map(async (innerItem, idx) => {
					if (innerItem.typeQty === "unitario") {
						return TreatmentExecution.createMany(
							Array.from(
								{ length: elem.quantity },
								() =>
									({
										economic_group_id: authCtx.group.id,
										business_unit_id: authCtx.unit.id,
										productivity_item_id: innerItem.id,

										// pk
										id: execCounter++ + idx,
										treatment_id: treatment.id,
										treatment_item_id: elem.id,

										scheduledQuantity: 1,
										quantityExecuted: 0,
										status: "Ativo",
									}) as Partial<TreatmentExecution>,
							),
							{ client: trx },
						);
					}

					return TreatmentExecution.create(
						{
							economic_group_id: authCtx.group.id,
							business_unit_id: authCtx.unit.id,
							productivity_item_id: innerItem.id,

							// pk
							id: execCounter++ + idx,
							treatment_id: treatment.id,
							treatment_item_id: elem.id,

							scheduledQuantity: elem.quantity,
							quantityExecuted: 0,
							status: "Ativo",
						},
						{
							client: trx,
						},
					);
				});

				return Promise.all(innerTasks);
			});
			await Promise.all(tasks2);
		});
	}

	async updateBillFinancialResponsible(
		authCtx: AuthContext,
		data: { billId: string; financialResponsibleId: string },
	) {
		await Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.billId)
				.first();

			if (!bill) {
				throw this.sharedService.ResourceNotFound();
			}

			const [fiscalDocuments, serviceFiscalDocuments] = await Promise.all([
				IssuedFiscalDocument.query()
					.useTransaction(trx)
					.where("bill_id", bill.id),
				ServiceIssuedFiscalDocument.query()
					.useTransaction(trx)
					.where("bill_id", bill.id),
			]);

			if (fiscalDocuments.length > 0) {
				throw new BadRequestException(
					"Não é possível alterar o responsável financeiro de uma nota fiscal já emitida",
					400,
					"E_ERR",
				);
			}

			if (serviceFiscalDocuments.length > 0) {
				throw new BadRequestException(
					"Não é possível alterar o responsável financeiro de uma nota fiscal de serviço já emitida",
					400,
					"E_ERR",
				);
			}

			await bill
				.merge({ financial_responsible_id: data.financialResponsibleId })
				.useTransaction(trx)
				.save();
		});
	}

	async checkDepositAvailability(
		authCtx: AuthContext,
		data: { items: { productVariationId: string; quantity: number }[] },
	) {
		const depositID =
			authCtx.$roleMetas.find((r) => r.default_sale_deposit_id)
				?.default_sale_deposit_id ??
			authCtx.unit.unitConfig.outgoing_deposit_id;

		if (!depositID) {
			throw new BadRequestException(
				"Não foi possível encontrar um depósito de saída padrão",
				400,
				"E_NO_DEPOSIT",
			);
		}

		const productVariations = await ProductVariation.query()
			.whereHas("product", (query) => {
				query.where("economic_group_id", authCtx.group.id);
			})
			.whereIn(
				"id",
				data.items.map((i) => i.productVariationId),
			)
			.preload("product");
		if (productVariations.length !== data.items.length) {
			throw new BadRequestException(
				"Algum produto não foi encontrado",
				400,
				"E_NO_PRODUCT",
			);
		}

		const depositItems = await DepositItem.query()
			.where("deposit_id", depositID)
			.whereIn(
				"product_variation_id",
				data.items.map((i) => i.productVariationId),
			);

		const invalidItems = productVariations.filter((item) => {
			const depositItem = depositItems.find(
				(i) => i.product_variation_id === item.id,
			);
			// nunca deve acontecer mas typescript
			if (!depositItem) {
				return false;
			}

			const row = data.items.find((i) => i.productVariationId === item.id);

			return depositItem.quantity.lessThan(row?.quantity ?? 0);
		});
		if (invalidItems.length > 0) {
			throw new BadRequestException(
				`Produtos com quantidade insuficiente para venda: ${invalidItems
					.map((i) => i.product.description)
					.join(", ")}}`,
				400,
				"E_NO_PRODUCT",
			);
		}
	}

	async discountDepositItems(
		authCtx: AuthContext,
		data: { items: { productVariationId: string; quantity: number }[] },
	) {
		const depositID =
			authCtx.$roleMetas.find((r) => r.default_sale_deposit_id)
				?.default_sale_deposit_id ??
			authCtx.unit.unitConfig.outgoing_deposit_id;

		if (!depositID) {
			throw new BadRequestException(
				"Não foi possível encontrar um depósito de saída padrão",
				400,
				"E_NO_DEPOSIT",
			);
		}

		const productVariations = await ProductVariation.query()
			.whereHas("product", (query) => {
				query.where("economic_group_id", authCtx.group.id);
			})
			.whereIn(
				"id",
				data.items.map((i) => i.productVariationId),
			)
			.preload("product");
		if (productVariations.length !== data.items.length) {
			throw new BadRequestException(
				"Algum produto não foi encontrado",
				400,
				"E_NO_PRODUCT",
			);
		}

		const depositItems = await DepositItem.query()
			.where("deposit_id", depositID)
			.whereIn(
				"product_variation_id",
				data.items.map((i) => i.productVariationId),
			);

		const tasks = depositItems.map((item) => {
			const row = data.items.find(
				(i) => i.productVariationId === item.product_variation_id,
			);
			return item
				.merge({
					quantity: item.quantity.minus(row?.quantity ?? 0),
				})
				.save();
		});
		await Promise.all(tasks);
	}

	async printPaymentReceipt(
		authCtx: AuthContext,
		billID: string,
		data: { billPayment?: string; block?: string },
	) {
		if (!validate(billID)) {
			throw new BadRequestException("ID de Venda inválido", 400, "E_ERR");
		}

		return Database.transaction(async (trx) => {
			const updateQb = Database.from("bill_payments")
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("bill_id", billID);

			if (data.billPayment) {
				updateQb.where("id", data.billPayment);
			}

			if (data.block) {
				updateQb.where("block", data.block);
			}

			await updateQb.update({
				printed_at: DateTime.now(),
				print_user_id: authCtx.user.id,
			});

			const toPrint = await Bill.query()
				.useTransaction(trx)
				.where("id", billID)
				.select("id", "tag", "bill_date", "business_unit_id", "client_id")
				.preload("businessUnit", (query) => {
					query.select(
						"id",
						"company_name",
						"document",
						"phone",
						"postal_code",
						"address",
						"number",
						"complement",
						"district",
						"city",
						"state",
					);
				})
				.preload("client", (query) => {
					query.select("id", "name");

					query.preload("tutor", (query) => {
						query.select("id", "document");
					});
				})
				.preload("payments", (query) => {
					if (data.billPayment) {
						query.where("id", data.billPayment);
					}

					if (data.block) {
						query.where("block", data.block);
					}

					query.whereHas("finance", (query) => {
						query.whereNotNull("payment_date");
					});

					query.select(
						"id",
						"total_value",
						"expiration_date",
						"printed_at",
						"payment_method_id",
						"print_user_id",
					);

					query.preload("paymentMethod", (query) => {
						query.select("id", "description");
					});

					query.preload("printUser", (query) => {
						query.select("id", "name");
					});

					query.preload("finance", (query) => {
						query.whereNotNull("payment_date");

						query.select("id", "payment_date", "payment_method_id");

						query.preload("paymentMethod", (query) => {
							query.select("id", "description");
						});
					});
				})
				.first();

			if (!toPrint) {
				throw new BadRequestException("Nota não encontrada", 400, "E_RR");
			}

			if (toPrint.payments.length === 0) {
				throw new BadRequestException(
					"Não existem titulos baixados para a impressão de recibo",
					400,
					"E_RR",
				);
			}

			return toPrint;
		});
	}

	async approveCourtesyOrMaxDiscount(
		authCtx: AuthContext,
		data: {
			billId: string;
			itemsIdList: string[];
			userEmail: string;
			userPwd: string;
			reason: string;
			approved: boolean;
			paymentsIdList?: string[];
		},
	) {
		return Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.billId)
				.preload("items")
				.preload("payments")
				.first();
			if (!bill) {
				throw new BadRequestException(
					"Nota de saída não encontrada",
					400,
					"E_ERR",
				);
			}

			const user = await User.query()
				.useTransaction(trx)
				.whereILike("email", data.userEmail)
				.where("system_id", authCtx.system.id)
				.first();

			if (!user) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (!(await Hash.verify(user.password, data.userPwd))) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			const hasPermissions = await this.sharedService.userHasPermission(
				{ ...authCtx, user },
				"VEN16",
			);
			if (!hasPermissions) {
				throw new UnauthorizedException(
					"Usuário sem permissão de fazer a operação",
					400,
					"E_ERR",
				);
			}

			if (
				bill.items.some(
					(i) =>
						i.status === BillItemStatus.A &&
						(i.maxDiscount || i.courtesy) &&
						!i.approved,
				)
			) {
				if (data.itemsIdList.length === 0) {
					throw new BadRequestException(
						"É preciso informar os itens a serem processados quando se tem itens pendentes",
						400,
						"E_ERR",
					);
				}
			}

			if (bill.payments.some((i) => i.pending)) {
				if (!data.paymentsIdList || data.paymentsIdList.length === 0) {
					throw new BadRequestException(
						"É preciso informar pagamentos a serem processados quando se tem pagamentos pendentes",
						400,
						"E_ERR",
					);
				}
			}

			await bill.merge({ pending: false }).useTransaction(trx).save();

			await BillItem.query()
				.useTransaction(trx)
				.where("bill_id", bill.id)
				.whereIn("id", data.itemsIdList)
				.update({
					courtesy_approved_user_id: user.id,

					pendingObservations: data.reason,
					courtesyApprovedAt: DateTime.now(),
					approved: data.approved,
				} as Partial<BillItem>);

			if (data.paymentsIdList) {
				await BillPayment.query()
					.useTransaction(trx)
					.where("bill_id", bill.id)
					.whereIn("id", data.paymentsIdList)
					.update({
						approved_user_id: user.id,
						pending: false,
						approved: data.approved,
						approvedAt: DateTime.now(),
						reason: data.reason,
					} as Partial<BillPayment>);
			}

			return null;
		});
	}

	async requestBillCancellation(
		authCtx: AuthContext,
		data: {
			userEmail: string;
			userPwd: string;
			reasonId?: string;
			cancelReason?: string;
			billId: string;
			billItems: { id: string; quantity: number }[];
			billPayments: string[];

			notes?: string;
		},
	) {
		if (!authCtx.hasPermission("VEN18")) {
			throw new UnauthorizedException(
				"Usuário sem permissão de fazer a operação",
				400,
				"E_ERR",
			);
		}

		await Database.transaction(async (trx) => {
			const user = await User.query()
				.useTransaction(trx)
				.whereILike("email", data.userEmail)
				.where("system_id", authCtx.system.id)
				.first();

			if (!user) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (!(await Hash.verify(user.password, data.userPwd))) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			const hasPermissions = await this.sharedService.userHasPermission(
				{ ...authCtx, user },
				"VEN18",
			);
			if (!hasPermissions) {
				throw new UnauthorizedException(
					"Usuário sem permissão de fazer a operação",
					400,
					"E_ERR",
				);
			}

			const bill = await Bill.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.billId)
				.preload("items", (query) => {
					query.whereIn(
						"id",
						data.billItems.map((bi) => bi.id),
					);

					query.preload("productVariation", (query) => {
						query.preload("product");
					});
				})
				.preload("payments", (query) => {
					query.whereIn("id", data.billPayments);
				})
				.first();

			if (!bill) {
				throw new BadRequestException(
					"Nota de saída não encontrada",
					400,
					"E_ERR",
				);
			}

			if (bill.cancelled) {
				throw new BadRequestException("Nota já cancelada", 400, "E_ERR");
			}

			const itemTasks = bill.items.map(async (item) => {
				return item
					.merge({
						cancelled: "P",
						originalTotalValue: new Decimal(item.totalValue),
						originalQuantity: item.quantity,
						cancelledQuantity:
							data.billItems.find((bi) => bi.id === item.id)?.quantity ?? 0,
					})
					.useTransaction(trx)
					.save();
			});
			const cancelledItems = await Promise.all(itemTasks);

			const paymentTasks = bill.payments.map(async (payment) => {
				return payment
					.merge({
						cancelled: "P",
					})
					.useTransaction(trx)
					.save();
			});
			await Promise.all(paymentTasks);

			await bill
				.merge({
					cancel_user_id: authCtx.user.id,
					cancel_reason_id: data.reasonId,

					cancelReason: data.cancelReason,
					cancelled: "P",
					cancelledAt: DateTime.now(),
					cancelNotes: data.notes,
					cancelValueTotal: cancelledItems.reduce(
						(acc, curr) =>
							acc.plus(
								new Decimal(curr.totalValue)
									.div(curr.quantity)
									.times(new Decimal(curr.cancelledQuantity ?? 1)),
							),
						new Decimal(0),
					),
					cancelValueProducts: cancelledItems.reduce(
						(acc, curr) =>
							curr.productVariation.product.type === ProductType.PRODUCT
								? acc.plus(
										new Decimal(curr.totalValue)
											.div(curr.quantity)
											.times(new Decimal(curr.cancelledQuantity ?? 1)),
									)
								: acc,
						new Decimal(0),
					),
					cancelValueServices: cancelledItems.reduce(
						(acc, curr) =>
							curr.productVariation.product.type === ProductType.SERVICE
								? acc.plus(
										new Decimal(curr.totalValue)
											.div(curr.quantity)
											.times(new Decimal(curr.cancelledQuantity ?? 1)),
									)
								: acc,
						new Decimal(0),
					),
				})
				.useTransaction(trx)
				.save();
		});
	}

	async reviewBillCancellation(
		authCtx: AuthContext,
		data: {
			userEmail: string;
			userPwd: string;
			billId: string;
			billItems: { id: string; cancelled: boolean; note: string }[];
			billPayments: { id: string; cancelled: boolean; note: string }[];
			noPayments?: boolean;
		},
	) {
		const user = await User.query()
			.whereILike("email", data.userEmail)
			.where("system_id", authCtx.system.id)
			.first();

		if (!user) {
			throw new BadRequestException(
				"Credenciais inválidas",
				400,
				"E_BAD_CREDENTIALS",
			);
		}

		if (!(await Hash.verify(user.password, data.userPwd))) {
			throw new BadRequestException(
				"Credenciais inválidas",
				400,
				"E_BAD_CREDENTIALS",
			);
		}

		if (data.billItems.length > 0 && !authCtx.hasPermission("VEN19")) {
			throw new UnauthorizedException(
				"Usuario não possui permissão para avaliar o cancelamento de itens",
				400,
				"E_ERR",
			);
		}

		if (data.billPayments.length > 0 && !authCtx.hasPermission("VEN20")) {
			throw new UnauthorizedException(
				"Usuario não possui permissão para avaliar o cancelamento de pagamentos",
				400,
				"E_ERR",
			);
		}

		return Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.billId)
				.preload("items", (query) => {
					query.whereIn(
						"id",
						data.billItems.map((i) => i.id),
					);
				})
				.preload("payments", (query) => {
					query.whereIn(
						"id",
						data.billPayments.map((i) => i.id),
					);
				})
				.first();

			if (!bill) {
				throw new BadRequestException(
					"Nota de saída não encontrada",
					400,
					"E_ERR",
				);
			}

			if (bill.cancelled !== "P" && bill.cancelled !== "F") {
				throw new BadRequestException("Nota já cancelada", 400, "E_ERR");
			}

			const itemTasks = bill.items
				.filter((elem) => data.billItems.find((bi) => bi.id === elem.id))
				.map(async (elem) => {
					const note = data.billItems.find((i) => i.id === elem.id)?.note;

					return elem
						.merge({
							reviewer_cancel_user_id: authCtx.user.id,
							reviewCancelDate: DateTime.now(),
							cancelled: data.billItems.find((i) => i.id === elem.id)?.cancelled
								? "S"
								: "N",
							reviewCancelNotes: note
								? [
										elem.reviewCancelNotes,
										`${DateTime.now()} - ${authCtx.user.name}\n${note}`,
									]
										.filter(Boolean)
										.join("\n")
								: elem.reviewCancelNotes,
						})
						.save();
				});
			const updatedItems = await Promise.all(itemTasks);
			await BillAuthorization.createMany(
				updatedItems.map<Partial<BillAuthorization>>((row) => ({
					bill_id: data.billId,
					bill_item_id: row.id,
					bill_payment_id: null,
					type: (
						[
							row.courtesy && "courtesy",
							row.maxDiscount && "maxDiscount",
							"cancel",
						] as BillAuthorization["type"][]
					)
						.filter(Boolean)
						.at(0),
					authorization_type: "RC",
					approved: row.approved,
					cancelled_quantity: row.cancelledQuantity,
					authorization_user_id: authCtx.user.id,
					authorization_date: DateTime.now(),
					authorization_observations: data.billItems.find(
						(bi) => bi.id === row.id,
					)?.note,
				})),
				{ client: trx },
			);

			if (
				bill.cancelled === "F" &&
				data.billPayments.length === 0 &&
				data.noPayments
			) {
				await bill
					.merge({
						cancelled: "A",
					})
					.useTransaction(trx)
					.save();
				return;
			}

			const paymentTasks = bill.payments
				.filter((elem) => data.billPayments.find((bi) => bi.id === elem.id))
				.map(async (elem) => {
					const note = data.billPayments.find((i) => i.id === elem.id)?.note;

					return elem
						.merge({
							reviewer_cancel_user_id: authCtx.user.id,
							reviewCancelDate: DateTime.now(),
							cancelled: data.billPayments.find((i) => i.id === elem.id)
								?.cancelled
								? "S"
								: "N",
							reviewCancelNotes: note
								? [
										elem.reviewCancelNotes,
										`${DateTime.now()} - ${authCtx.user.name}\n${note}`,
									]
										.filter(Boolean)
										.join("\n")
								: elem.reviewCancelNotes,
						})
						.save();
				});
			const updatedPayments = await Promise.all(paymentTasks);
			await BillAuthorization.createMany(
				updatedPayments.map<Partial<BillAuthorization>>((row) => ({
					bill_id: data.billId,
					bill_item_id: null,
					bill_payment_id: row.id,
					type: "maxParcelas",
					authorization_type: "P",
					approved: row.approved,
					authorization_user_id: authCtx.user.id,
					authorization_date: DateTime.now(),
					authorization_observations: data.billPayments.find(
						(bi) => bi.id === row.id,
					)?.note,
				})),
				{ client: trx },
			);

			const billStatus: { status: "P" | "F" | "A"; order: number } | null =
				await Database.from("bill_items")
					.useTransaction(trx)
					.select(Database.raw("'P' as status, 1 as ordem"))
					.where("cancelled", "P")
					.where("bill_id", bill.id)
					.whereNull("deleted_at")
					.union((query) => {
						query
							.from("bill_items")
							.select(Database.raw("'F' as status, 3 as ordem"))
							.whereIn("cancelled", ["S", "N"])
							.where("bill_id", bill.id)
							.whereNull("deleted_at");
					})
					.union((query) => {
						query
							.from("bill_items")
							.select(Database.raw("'A' as status, 2 as ordem"))
							.joinRaw(
								"join bill_payments on bill_items.bill_id = bill_payments.bill_id",
							)
							.where("bill_items.bill_id", bill.id)
							.whereRaw("coalesce(bill_items.cancelled, '') not in ('P')")
							.whereRaw(
								"coalesce(bill_payments.cancelled, '') not in ('P', '')",
							)
							.whereRaw("bill_items.deleted_at is null")
							.whereRaw("bill_payments.deleted_at is null");
					})
					.orderByRaw("ordem")
					.first();

			if (billStatus) {
				await bill
					.merge({
						cancelled: billStatus.status,
					})
					.useTransaction(trx)
					.save();
			}
		});
	}

	async finishBillCancellation(
		authCtx: AuthContext,
		data: {
			userEmail: string;
			userPwd: string;
			billId: string;
			cancelled: boolean;
			note: string;
		},
	) {
		const user = await User.query()
			.whereILike("email", data.userEmail)
			.where("system_id", authCtx.system.id)
			.first();

		if (!user) {
			throw new BadRequestException(
				"Credenciais inválidas",
				400,
				"E_BAD_CREDENTIALS",
			);
		}

		if (!(await Hash.verify(user.password, data.userPwd))) {
			throw new BadRequestException(
				"Credenciais inválidas",
				400,
				"E_BAD_CREDENTIALS",
			);
		}

		if (!authCtx.hasPermission("VEN21")) {
			throw new UnauthorizedException(
				"Usuario não possui permissão para finalizar o cancelamento da venda",
				400,
				"E_ERR",
			);
		}

		return Database.transaction(async (trx) => {
			const bill = await Bill.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.billId)
				.first();

			if (!bill) {
				throw new BadRequestException(
					"Nota de saída não encontrada",
					400,
					"E_ERR",
				);
			}

			if (bill.cancelled !== "A") {
				throw new BadRequestException(
					"Venda não pode ser finalizada pois não foi avaliada pelo depto Tecnico e depto Financeiro",
					400,
					"E_ERR",
				);
			}

			await bill
				.merge({
					finish_cancel_user_id: user.id,
					cancelled: data.cancelled ? "S" : "N",
					finishCancelDate: DateTime.now(),
					cancelNotes: `${bill.cancelNotes}\n${DateTime.now()} - ${user.name}\n${data.note}}`,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async deleteItemDepartments(
		authCtx: AuthContext,
		data: {
			billId: string;
			billItemId: string;
			billItemDepartmentId: number;
			departmentId: number;
			departmentItemId: number;
		},
	) {
		await BillItemDepartment.query()
			.where("id", data.billItemDepartmentId)
			.where("bill_id", data.billId)
			.where("bill_item_id", data.billItemId)
			.where("department_id", data.departmentId)
			.where("department_item_id", data.departmentItemId)
			.update({
				deleted_user_id: authCtx.user.id,
				deletedAt: DateTime.now(),
			});
	}

	private async syncBillPendingAndSum(
		trx: TransactionClientContract,
		bill: Bill,
	) {
		const validItems = await BillItem.query()
			.useTransaction(trx)
			.where("bill_id", bill.id)
			.where("status", BillItemStatus.A)
			.preload("taxRule")
			.preload("productVariation", (query) => query.preload("product"));

		const [productSum, serviceSum, discountSum] = validItems.reduce(
			(acc, curr) => {
				if (curr.productVariation.product.type === ProductType.PRODUCT) {
					acc[0] +=
						curr.unitaryValue * curr.quantity.toNumber() - curr.discountValue;
				}
				if (curr.productVariation.product.type === ProductType.SERVICE) {
					acc[1] +=
						curr.unitaryValue * curr.quantity.toNumber() - curr.discountValue;
				}

				acc[2] += curr.discountValue;

				return acc;
			},
			[0, 0, 0],
		);

		const pendingItems = await BillItem.query()
			.useTransaction(trx)
			.where("bill_id", bill.id)
			.where("status", BillItemStatus.A)
			.whereRaw(
				"((courtesy = true or max_discount = true) and courtesy_approved_at is null)",
			);

		const pendingPayments = await BillPayment.query()
			.useTransaction(trx)
			.where("bill_id", bill.id)
			.whereRaw("pending is true");

		await bill
			.merge({
				pending:
					pendingItems.some(
						(f) =>
							(f.courtesy && !f.courtesy_approved_user_id) ||
							(f.maxDiscount && !f.courtesy_approved_user_id),
					) || pendingPayments.length > 0,
				productValue: productSum,
				serviceValue: serviceSum,
				discountValue: discountSum,
				totalValue: productSum + serviceSum,
			})
			.useTransaction(trx)
			.save();
	}
}
