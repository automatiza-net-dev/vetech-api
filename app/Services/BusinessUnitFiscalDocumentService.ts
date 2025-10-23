import { inject } from "@adonisjs/fold";
import Logger from "@ioc:Adonis/Core/Logger";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import Bill, { BillStatus } from "App/Models/Bill";
import BillItem, { BillItemStatus } from "App/Models/BillItem";
import BusinessUnit from "App/Models/BusinessUnit";
import BusinessUnitFiscalDocument, {
	BusinessUnitFiscalDocumentMovementType,
} from "App/Models/BusinessUnitFiscalDocument";
import CorrectedFiscalDocument from "App/Models/CorrectedFiscalDocument";
import IssuedFiscalDocument, {
	IssuedFiscalDocumentContingency,
} from "App/Models/IssuedFiscalDocument";
import PatientTutor from "App/Models/PatientTutor";
import { PaymentMethodTef } from "App/Models/PaymentMethod";
import { ProductType } from "App/Models/Product";
import ReceiptXml from "App/Models/ReceiptXml";
import ServiceIssuedFiscalDocument from "App/Models/ServiceIssuedFiscalDocument";
import { MovementCategory } from "App/Models/TaxationGroupRule";
import User from "App/Models/User";
import FocusNfeService, {
	ISendNfe,
	ISendNfse,
	disableWebhookResponseSchema,
	nfeResponseSchema,
	nfseResponseSchema,
} from "App/Services/FocusNfeService";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IBusinessUnitFiscalDocumentData, {
	IAuthorizeFiscalDocument,
	IAuthorizeNfseFiscalDocument,
	ICancelFiscalDocument,
	ICorrectFiscalDocument,
	IDisableFiscalDocument,
} from "Contracts/interfaces/IBusinessUnitFiscalDocumentData";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { validate } from "uuid";
import { z } from "zod";
import ReceiptService from "./ReceiptService";

interface ISearch {
	unit?: string;
	type?: BusinessUnitFiscalDocumentMovementType;
	bill?: string;
	active?: string;
	document?: string;
}

interface ISearchDocument {
	document?: string;
	movement?: string;
}

@inject()
export default class BusinessUnitFiscalDocumentService {
	constructor(
		private sharedService: SharedService,
		private focusNfe: FocusNfeService,
		private receiptService: ReceiptService,
	) {}

	async nfeIndex(unitId: string, data: ISearch) {
		const qb = IssuedFiscalDocument.query().where(
			"business_unit_id",
			data.unit ?? unitId,
		);

		if (data.type) {
			qb.where("movement_type", data.type);
		}

		if (data.document) {
			qb.where("fiscal_document_id", data.document);
		}

		if (data.bill) {
			qb.where("bill_id", data.bill);
		}

		if (data.active) {
			qb.where("active", data.active === "true");
		}

		qb.preload("corrections");

		return qb;
	}

	async nfseIndex(unitId: string, data: ISearch) {
		const qb = ServiceIssuedFiscalDocument.query().where(
			"business_unit_id",
			data.unit ?? unitId,
		);

		// if (data.type) {
		//   qb.where('movement_type', data.type);
		// }

		// if (data.document) {
		//   qb.where('fiscal_document_id', data.document);
		// }

		if (data.bill) {
			qb.where("bill_id", data.bill);
		}

		return qb;
	}

	async search(unitId: string, data: ISearchDocument) {
		const qb = BusinessUnitFiscalDocument.query()
			.preload("fiscalDocument")
			.orderByRaw("model, movement_type , document_type")
			.where("business_unit_id", unitId);

		if (data.document) {
			const isSingle = !data.document.includes(",");
			const tokens = data.document.split(",");

			if (isSingle) {
				qb.where("document_type", data.document);
			} else {
				qb.whereIn("document_type", tokens);
			}
		}

		if (data.movement) {
			const isSingle = !data.movement.includes(",");
			const tokens = data.movement.split(",");

			if (isSingle) {
				qb.where("movement_type", data.movement);
			} else {
				qb.whereIn("movement_type", tokens);
			}
		}

		return qb;
	}

	async store(unitId: string, data: IBusinessUnitFiscalDocumentData) {
		const group = await this.sharedService.getUserGroup(unitId);

		return BusinessUnitFiscalDocument.create({
			economic_group_id: group.id,
			business_unit_id: unitId,

			documentType: data.type,
			movementType: data.movement,
			description: data.description,
			model: data.model,
			series: data.series,
			sequence: data.sequence,
			fiscal_document_id: data.fiscalDocumentId,
		});
	}

	async getPeriodXmls(
		authCtx: AuthContext,
		data: {
			businessUnitId: string;
			periodo: string;
		},
	) {
		if (!authCtx.hasPermission("REL18")) {
			throw new UnauthorizedException(
				"Sem permissão para ver o relatório",
				400,
				"E_ERR",
			);
		}

		if (!data.businessUnitId || !validate(data.businessUnitId)) {
			throw new BadRequestException("Unidade inválida", 400, "E_ERR");
		}

		const unit = await BusinessUnit.query()
			.where("id", data.businessUnitId)
			.preload("unitConfig")
			.first();
		if (!unit) {
			throw new BadRequestException("Unidade inválida", 404, "E_ERR");
		}

		const token = this.getToken(unit);

		return await this.focusNfe.getDownloadLinks(token, {
			periodo: data.periodo,
			cnpj: unit.document?.replaceAll(/\D/g, "") ?? "",
		});
	}

	async authorize(authCtx: AuthContext, data: IAuthorizeFiscalDocument) {
		return Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", authCtx.unit.id)
				.preload("unitConfig")
				.preload("acquirers")
				.firstOrFail();

			const token = this.getToken(unit);

			const bill = await Bill.query()
				.where("id", data.billId)
				.preload("client", (query) => {
					query.preload("tutor");
				})
				.preload("financialResponsible", (query) => {
					query.preload("tutor");
				})
				.preload("payments", (query) => {
					query.preload("paymentMethod");
					query.preload("flag");
				})
				// .preload('items', query => {
				//   query.where('status', BillStatus.A);
				//
				//   query.preload('productVariation', query => {
				//     query.preload('product', query => {
				//       query.preload('unit');
				//     });
				//   });
				// })
				.useTransaction(trx)
				.firstOrFail();

			if (bill.status !== BillStatus.B) {
				throw new BadRequestException(
					"Documento em estado inválido",
					400,
					"E_INVALID_STATE",
				);
			}

			const items = await BillItem.query()
				.useTransaction(trx)
				.where("bill_id", bill.id)
				.where("nfe_issued", false)
				.where("status", BillItemStatus.A)
				.where("total_value", ">", 0)
				.whereHas("productVariation", (query) => {
					query.whereHas("product", (query) => {
						query.where("type", ProductType.PRODUCT);
					});
				})
				.preload("productVariation", (query) => {
					query.preload("product", (query) => {
						query.preload("unit");
					});
				})
				.preload("taxRule", (query) => {
					query.preload("taxOperation");
				});

			if (items.length === 0) {
				throw new BadRequestException("Não existe item para ser emitido");
			}

			if (items.some((it) => !it.productVariation.product.ncm)) {
				const itemsWithoutNcm = items.filter(
					(it) => !it.productVariation.product.ncm,
				);
				throw new BadRequestException(
					`É necessário preencher o "Codigo Ncm" dos seguintes produtos antes de emitir a nota fiscal: ${itemsWithoutNcm.map((it) => it.productVariation.product.description)}`,
					400,
					"E_ERR",
				);
			}

			if (items.some((it) => !it.productVariation.product.unit_id)) {
				const itemsWithoutUnit = items.filter(
					(it) => !it.productVariation.product.unit_id,
				);
				throw new BadRequestException(
					`É necessário preencher a "Unidade" dos seguintes produtos antes de emitir a nota fiscal: ${itemsWithoutUnit.map((it) => it.productVariation.product.description).join(", ")}`,

					400,
					"E_ERR",
				);
			}

			if (items.some((it) => !it.tax_rule_id)) {
				const itemsWithoutTaxRule = items.filter(
					(it) => !it.productVariation.product.unit_id,
				);
				throw new BadRequestException(
					`Os itens abaixo estão sem as informações de impostos preenchidas. Entre em contato com o suporte para fazer esta configuração: ${itemsWithoutTaxRule.map((it) => it.productVariation.product.description).join(", ")}`,
					400,
					"E_ERR",
				);
			}

			if (
				bill.financialResponsible &&
				!bill.financialResponsible.tutor.document
			) {
				throw new BadRequestException(
					"O cpf/cnpj do Responsavel Financeiro da venda está em branco ou inválido",
					400,
					"E_ERR",
				);
			}

			if (!bill.financialResponsible && !bill.client.tutor.document) {
				throw new BadRequestException(
					"O cpf/cnpj do Cliente da venda está em branco ou inválido",
					400,
					"E_ERR",
				);
			}

			const issuedDocumentAlready = await IssuedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.where("bill_id", data.billId)
				.first();

			if (issuedDocumentAlready?.authorizationReceipt) {
				throw new BadRequestException(
					"Documento já autorizado",
					400,
					"E_ALREADY_ISSUED",
				);
			}

			// if (items.some((i) => !i.tax_rule_id)) {
			// 	throw new BadRequestException(
			// 		"Item da Nota não tem imposto definido",
			// 		400,
			// 		"E_NO_TAX_RULE",
			// 	);
			// }

			const document = await BusinessUnitFiscalDocument.findOrFail(
				data.unitFiscalDocumentId,
				{
					client: trx,
				},
			);

			// before or after?
			await document
				.merge({
					sequence: document.sequence + 1,
				})
				.useTransaction(trx)
				.save();

			const issuedDocument = await IssuedFiscalDocument.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					bill_id: data.billId,
					movementType: data.type,
					fiscal_document_id: document.id,
					model: document.model,
					series: document.series,
					sequence: (document.sequence + 1).toString(),
					user_who_authorized_id: authCtx.user.id,
					authorizationDate: DateTime.now(),
					contingency: IssuedFiscalDocumentContingency.N,
					active: true,
					purpose: "Emissão", // TODO check
					totalValue: items.reduce(
						(acc, curr) => acc.plus(curr.totalValue),
						new Decimal(0),
					),

					finality: items.some(
						(c) => c.taxRule.movementCategory === MovementCategory.DS,
					)
						? 4
						: 1,
					accessKeyRef: data.accessKeyRef,
				},
				{
					client: trx,
				},
			);

			const responsible = bill.financialResponsible ?? bill.client;
			const clearDoc = responsible.tutor.document?.replaceAll(/\D/g, "") ?? "";

			const precalculatedValues: {
				payment_id: string;
				installment_value: string;
				product_installment_value: string;
			}[] = await Database.from("payments_with_order")
				.useTransaction(trx)
				.with("block_totals", (qb) => {
					qb.from("bills")
						.select(
							Database.raw(`bills.id,
                             bill_payments.block,
                             bills.product_value / bills.total_value as product_proportion,
                             round(SUM(bill_payments.total_value * (bills.product_value / bills.total_value))::numeric,
                                   2)                                as block_total,
                             bill_payments.qty_installments          as total_installments`),
						)
						.joinRaw("join bill_payments on bills.id = bill_payments.bill_id")
						.where("bills.id", bill.id)
						.whereRaw("bill_payments.deleted_at IS NULL")
						.groupByRaw(
							"bills.id, bill_payments.block, bill_payments.qty_installments, bill_payments.block",
						);
				})
				.with("block_calculations", (qb) => {
					qb.from("block_totals").select(
						Database.raw(`block_totals.block,
                    block_totals.block_total,
                    block_totals.total_installments,
                    round((block_totals.block_total / block_totals.total_installments)::numeric, 2) as base_value,
                    block_totals.block_total -
                    (round((block_totals.block_total / block_totals.total_installments)::numeric, 2) *
                     block_totals.total_installments)                                               as remainder,
                    block_totals.product_proportion`),
					);
				})
				.with("payments_with_order", (qb) => {
					qb.from("bill_payments")
						.select(
							Database.raw(`bill_payments.*,
                                    ROW_NUMBER() OVER (PARTITION BY bill_payments.block ORDER BY bill_payments.installments) as row_num,
                                    COUNT(*) OVER (PARTITION BY bill_payments.block)                              as total_in_block`),
						)
						.where("bill_payments.bill_id", bill.id)
						.whereRaw("bill_payments.deleted_at IS NULL");
				})
				.select(
					Database.raw(`payments_with_order.id as payment_id,
       CASE
           WHEN payments_with_order.row_num = payments_with_order.total_in_block THEN
               block_calculations.base_value + block_calculations.remainder
           ELSE
               block_calculations.base_value
           END                as installment_value,
       CASE
           WHEN payments_with_order.row_num = payments_with_order.total_in_block THEN
               (block_calculations.base_value + block_calculations.remainder)
           ELSE
               block_calculations.base_value
           END                as product_installment_value`),
				)
				.joinRaw("join bills ON payments_with_order.bill_id = bills.id")
				.joinRaw(
					"join block_calculations ON payments_with_order.block = block_calculations.block",
				)
				.orderByRaw(
					"payments_with_order.bill_id, payments_with_order.block, payments_with_order.installments",
				);

			const nfePayload: ISendNfe = {
				nfe_series: issuedDocument.series,
				nfe_number: issuedDocument.sequence,
				issuedAt: issuedDocument.authorizationDate.toISO() ?? "",
				authorizedAt: issuedDocument.authorizationDate.toISO() ?? "",
				purpose: issuedDocument.purpose,
				finality: issuedDocument.finality,
				accessKeyRef: issuedDocument.accessKeyRef,
				model: issuedDocument.model,
				additionalInformation: bill.additionalInformation,

				seller: {
					cnpj: unit.document?.replace(/\D/g, "") ?? "",
					name: unit.companyName,
					fantasy_name: unit.fantasyName,
					phone: unit.phone,
					city_ie: unit.cityRegistration,
					state_ie: unit.stateRegistration,
					cnae: unit.cnae,
					regime: unit.simple ? "1" : "3",
					location: {
						street: unit.address ?? "",
						number: unit.number ?? "",
						complement: unit.complement ?? "",
						district: unit.district ?? "",
						city: unit.city ?? "",
						uf: unit.state ?? "",
						code: unit.postalCode ?? "",
					},
				},
				buyer: {
					name:
						unit.unitConfig.fiscalDocumentEnvironment === "H"
							? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
							: responsible.name,
					cpf_document: clearDoc.length === 11 ? clearDoc : null,
					cnpj_document: clearDoc.length === 14 ? clearDoc : null,
					phone:
						[responsible.tutor.cellphone, responsible.tutor.telephone].find(
							Boolean,
						) ?? "",
					ie: responsible.tutor.inscription ?? "",
					email: responsible.tutor.email,
					authorized: unit.unitConfig.xmlDownloadAuthorization ?? "",
					code: this.calcCode(issuedDocument, responsible.tutor),

					location: {
						street: responsible.tutor.street ?? "",
						number: responsible.tutor.number ?? "",
						complement: responsible.tutor.complement ?? "",
						district: responsible.tutor.district ?? "",
						city: responsible.tutor.city ?? "",
						uf: responsible.tutor.state ?? "",
						code: responsible.tutor.postalCode ?? "",
					},
				},
				items: [],
				payments: bill.payments.map((item) => ({
					nfe_code: item.paymentMethod.nfe_code,
					description:
						item.paymentMethod.nfe_code === "99"
							? item.paymentMethod.description
							: null,
					installment: new Decimal(
						precalculatedValues.find((pv) => pv.payment_id === item.id)
							?.product_installment_value ?? 0,
					).toNumber(),
					integration_type:
						// eslint-disable-next-line no-nested-ternary
						item.paymentMethod.tef === PaymentMethodTef.N
							? null
							: item.paymentMethod.tef === PaymentMethodTef.T
								? "1"
								: "2",
					acquirer:
						item.paymentMethod.tef === PaymentMethodTef.N
							? null
							: unit.acquirers.find((a) => a.id === item.tef_acquirer_id)
									?.document,
					flag: item?.flag?.nfe_code,
					nsu:
						item.paymentMethod.tef === PaymentMethodTef.N
							? undefined
							: item.nsuDocument,
				})),
				totalizers: {
					// icms_base: bill.icmsBase,
					// icms_total: bill.icmsValue,
					// fcp_total: bill.icmsFcpValue,
					// product_value: bill.productValue,
					delivery_value: bill.deliveryValue,
					// discount_value: bill.discountValue,
					// ipi_value: bill.ipiValue,
					// pis_value: bill.pisValue,
					// cofins_value: bill.cofinsValue,
					other_value: bill.otherValue,
				},
			};

			const cestTasks = items.map((item, idx) => {
				const result: ISendNfe["items"][number] = {
					index: (idx + 1).toString(),
					code: item.product_variation_id,
					barcode: item.productVariation.barcode,
					description: item.productVariation.product.description,
					ncm: item.productVariation.product.ncm?.replace(/\D/g, "") ?? "",
					cest: item.productVariation.product.cest?.replace(/\D/g, "") ?? "",
					tax_benefit_code: item.productVariation.product.taxBenefitCode,
					cfop: item.fiscalOperationCode,
					unity: item.productVariation.product.unit.tag,
					quantity: item.quantity.toString(),
					value: item.unitaryValue.toString(),
					discount: item.discountValue,

					icms_origin: item.productVariation.product.icmsOrigin,
					cst_icms: item.icmsCst,

					fcp_percentage: item.icmsFcpPercentage,
					fcp_base_calc: item.icmsBase,
					fcp_value: item.icmsFcpValue,

					cst_ipi: item.ipiValue > 0 ? item.ipiCst : null,
					ipi_base: item.ipiValue > 0 ? item.ipiBase : null,
					ipi_percentage: item.ipiValue > 0 ? item.ipiPercentage : null,
					ipi_value: item.ipiValue > 0 ? item.ipiValue : null,

					cst_pis: item.pisCst,
					pis_base: item.pisBase,
					pis_percentage: item.pisPercentage,
					pis_value: item.pisValue,

					cst_cofins: item.cofinsCst,
					cofins_base: item.cofinsBase,
					cofins_percentage: item.cofinsPercentage,
					cofins_value: item.cofinsValue,
				};

				if (
					["10", "30", "70", "90", "201", "202", "203", "900"].includes(
						item.icmsCst,
					) &&
					(item.icmsStBase ?? 0) > 0
				) {
					result.icms_st_modality = 4;
					result.icms_st_additional = item.icmsStIva;
					result.icms_st_red_calc = item.icmsStPercentageRedBase;
					result.icms_st_base = item.icmsStBase;
					result.icms_st_percentage = item.icmsStPercentageUfDestination;
					result.icms_st_value = item.icmsStValue;
				}

				if (
					["00", "10", "20", "51", "60", "70", "90", "900"].includes(
						item.icmsCst,
					)
				) {
					result.icms_modality = 3;
					result.icms_base = item.icmsBase;
					result.icms_percentage = item.icmsPercentage;
					result.icms_value = item.icmsValue;
				}

				if (["20", "51", "70", "90", "900"].includes(item.icmsCst)) {
					result.icms_red_calc = item.icmsStPercentageRedBase;
				}

				if (["51"].includes(item.icmsCst)) {
					result.icms_deferred_operation_value =
						item.icmsDeferredOperationValue;
					result.icms_deferred_value = item.icmsDeferredValue;
					result.icms_deferred_percentage = item.icmsDeferredPercentage;
				}

				return result;
			});
			nfePayload.items = cestTasks;

			const result = await this.focusNfe.sendNfe(
				issuedDocument.id,
				nfePayload,
				token,
			);

			await BillItem.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					items.map((i) => i.id),
				)
				.update({
					nfe_issued: result.success,
				});

			if (result.chave || result.numero) {
				await issuedDocument
					.merge({
						sequence: result.numero ?? result.chave?.substring(28, 28 + 9),
					})
					.useTransaction(trx)
					.save();
			}

			if (!result.success) {
				await issuedDocument
					.merge({
						sefazStatus: "rejeitado",
						sefazMessage: result.message,
					})
					.useTransaction(trx)
					.save();
			}

			if (!result.success) {
				return {
					success: false,
					message: result.message,
				};
			}

			return issuedDocument;
		});
	}

	async authorizeNfse(
		authCtx: AuthContext,
		data: IAuthorizeNfseFiscalDocument,
	) {
		return Database.transaction(async (trx) => {
			return this.$sendNfse(trx, authCtx, data);
		});
	}

	async resendNfse(authCtx: AuthContext, data: { documentId: string }) {
		return Database.transaction(async (trx) => {
			const serviceDocument = await ServiceIssuedFiscalDocument.query()
				.useTransaction(trx)
				.where("id", data.documentId)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!serviceDocument) {
				throw this.sharedService.ResourceNotFound();
			}

			if (serviceDocument.status !== "erro_autorizacao") {
				throw new BadRequestException(
					"Nota não pode ser retransmitida",
					400,
					"E_INVALID_STATE",
				);
			}

			await serviceDocument
				.merge({ deletedAt: DateTime.now() })
				.useTransaction(trx)
				.save();

			const items = await serviceDocument
				.related("items")
				.query()
				.useTransaction(trx);

			const updateQb = BillItem.query()
				.useTransaction(trx)
				.whereHas("productVariation", (query) => {
					query.whereHas("product", (query) => {
						query.where("type", ProductType.SERVICE);
					});
				})
				.update({
					nfe_issued: false,
				});

			if (authCtx.unit.unitConfig.groupNfseDocuments) {
				updateQb
					.whereIn(
						"id",
						items.map((i) => i.bill_item_id),
					)
					.where("bill_id", serviceDocument.bill_id);
			} else {
				updateQb
					.where("id", serviceDocument.bill_item_id)
					.where("bill_id", serviceDocument.bill_id);
			}

			await updateQb;

			return this.$sendNfse(trx, authCtx, {
				billId: serviceDocument.bill_id,
				unitFiscalDocumentId: serviceDocument.fiscal_document_id,
			});
		});
	}

	private async $sendNfse(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		data: IAuthorizeNfseFiscalDocument,
	) {
		const token = this.getToken(authCtx.unit);

		const document = await BusinessUnitFiscalDocument.findOrFail(
			data.unitFiscalDocumentId,
			{
				client: trx,
			},
		);

		const bill = await Bill.query()
			.useTransaction(trx)
			.where("id", data.billId)
			.preload("client", (query) => {
				query.preload("tutor");
			})
			.preload("financialResponsible", (query) => {
				query.preload("tutor");
			})
			.firstOrFail();

		if (bill.status !== BillStatus.B) {
			throw new BadRequestException(
				"Documento em estado inválido",
				400,
				"E_INVALID_STATE",
			);
		}

		if (
			bill.financialResponsible &&
			!bill.financialResponsible.tutor.document
		) {
			throw new BadRequestException(
				"O cpf/cnpj do Responsavel Financeiro da venda está em branco ou inválido",
				400,
				"E_ERR",
			);
		}

		if (!bill.financialResponsible && !bill.client.tutor.document) {
			throw new BadRequestException(
				"O cpf/cnpj do Cliente da venda está em branco ou inválido",
				400,
				"E_ERR",
			);
		}

		const items = await BillItem.query()
			.useTransaction(trx)
			.where("bill_id", bill.id)
			.where("nfe_issued", false)
			.where("total_value", ">", 0)
			.where("status", BillItemStatus.A)
			.whereHas("productVariation", (query) => {
				query.whereHas("product", (query) => {
					query.where("type", ProductType.SERVICE);
				});
			})
			.preload("productVariation", (query) => {
				query.preload("product");
			});

		if (items.length === 0) {
			throw new BadRequestException("Não existe documento para ser emitido");
		}

		const productsWithoutServiceCode = items.filter(
			(i) => !i.productVariation.product.serviceCode,
		);
		if (productsWithoutServiceCode.length > 0) {
			throw new BadRequestException(
				`É necessário preencher o "Codigo de Serviço" dos seguintes serviços antes de emitir a nota fiscal: ${productsWithoutServiceCode.map((p) => p.productVariation.product.description).join(", ")}`,
				400,
				"E_ERR",
			);
		}

		const responsible = bill.financialResponsible ?? bill.client;

		if (!authCtx.unit.unitConfig.groupNfseDocuments) {
			const results = await Promise.all(
				items.map(async (item) => {
					const clearDoc =
						responsible.tutor.document?.replaceAll(/\D/g, "") ?? "";

					const serviceDocument = await ServiceIssuedFiscalDocument.create(
						{
							economic_group_id: authCtx.group.id,
							business_unit_id: authCtx.unit.id,
							bill_id: data.billId,
							bill_item_id: item.id,
							fiscal_document_id: document.id,
							user_who_authorized_id: authCtx.user.id,

							authorizationDate: DateTime.now(),
							model: document.model,
							totalValue: items.reduce(
								(acc, curr) => acc.plus(curr.totalValue),
								new Decimal(0),
							),
						},
						{
							client: trx,
						},
					);

					const payload: ISendNfse = {
						issuedAt: new Date().toISOString(),
						simple: authCtx.unit.simple,
						seller: {
							document: authCtx.unit.document ?? "",
							city_ie: authCtx.unit.cityRegistration ?? "",
							city_code: authCtx.unit.cityCode ?? "",
						},
						buyer: {
							cpf_document: clearDoc.length === 11 ? clearDoc : null,
							cnpj_document: clearDoc.length === 14 ? clearDoc : null,
							name: responsible.name,
							email: responsible.tutor.email,
							phone:
								[responsible.tutor.cellphone, responsible.tutor.telephone].find(
									Boolean,
								) ?? "",
							address: {
								street: responsible.tutor.street ?? "",
								number: responsible.tutor.number ?? "s/n",
								district: responsible.tutor.district ?? "",
								city_code: responsible.tutor.cityCode ?? "",
								uf: responsible.tutor.state ?? "",
								postal_code: responsible.tutor.postalCode ?? "",
								complement: responsible.tutor.complement ?? null,
							},
						},
						service: {
							total_value: item.totalValue,
							pis_value: item.pisValue,
							cofins_value: item.cofinsValue,
							iss_value: item.issValue,
							base_value: item.issBase,
							percentage_value: item.issPercentage,
							discount_value: item.discountValue,
							service_code: item.productVariation.product.serviceCode ?? "",
							cnae: authCtx.unit.cnae ?? "",
							description:
								authCtx.unit.unitConfig.defaultNfseDescription ??
								item.productVariation.product.description,
							city_code: authCtx.unit.cityCode ?? "",
						},
					};

					if (payload.buyer.phone === "") {
						throw new BadRequestException(
							"Cliente não tem um telefone para contato",
							400,
							"E_ERR",
						);
					}

					const result = await this.focusNfe.sendNfse(
						serviceDocument.id,
						payload,
						token,
						{
							hideCnae:
								authCtx.unit.unitConfig.config.fiscalDocuments?.nfse_hide_cnae,
							hideCityCode:
								authCtx.unit.unitConfig.config.fiscalDocuments
									?.nfse_hide_codigo_tributario_municipio,
						},
					);

					await serviceDocument
						.merge({
							rpsNumber: result.data?.numero_rps,
							rpsSeries: result.data?.serie_rps.toString(),
							status: result.data?.status,
							errors: result.data?.erros,
						})
						.useTransaction(trx)
						.save();

					await item
						.merge({
							nfeIssued: result.success,
						})
						.useTransaction(trx)
						.save();

					return result;
				}),
			);

			return results.filter((r) => !r.success);
		}

		const map: Map<string, BillItem[]> = new Map();
		for (const item of items) {
			const key = [
				item.issPercentage,
				item.productVariation.product.serviceCode,
			].join("__");

			if (!map.has(key)) {
				map.set(key, []);
			}

			map.get(key)?.push(item);
		}

		const tasks = Array.from(map.entries()).map(async ([key, mapItems]) => {
			const [rawPercentage, serviceCode] = key.split("__");
			const issPercentage = Number.parseFloat(rawPercentage);

			const serviceDocument = await ServiceIssuedFiscalDocument.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					fiscal_document_id: document.id,
					user_who_authorized_id: authCtx.user.id,
					authorizationDate: DateTime.now(),
					model: document.model,
					bill_id: bill.id,
				},
				{
					client: trx,
				},
			);

			const clearDoc = responsible.tutor.document?.replaceAll(/\D/g, "") ?? "";

			const result = await this.focusNfe.sendNfse(
				serviceDocument.id,
				{
					issuedAt: new Date().toISOString(),
					simple: authCtx.unit.simple,
					seller: {
						document: authCtx.unit.document ?? "",
						city_ie: authCtx.unit.cityRegistration ?? "",
						city_code: authCtx.unit.cityCode ?? "",
					},
					buyer: {
						cpf_document: clearDoc.length === 11 ? clearDoc : null,
						cnpj_document: clearDoc.length === 14 ? clearDoc : null,
						name: responsible.name,
						email: responsible.tutor.email,
						phone:
							[responsible.tutor.cellphone, responsible.tutor.telephone].find(
								Boolean,
							) ?? "",

						address: {
							street: responsible.tutor.street ?? "",
							number: responsible.tutor.number ?? "",
							district: responsible.tutor.district ?? "",
							city_code: responsible.tutor.cityCode ?? "",
							uf: responsible.tutor.state ?? "",
							postal_code: responsible.tutor.postalCode ?? "",
							complement: responsible.tutor.complement ?? null,
						},
					},
					service: {
						total_value: this.sharedService.sum(
							mapItems.map((i) => i.totalValue),
						),
						pis_value: this.sharedService.sum(mapItems.map((i) => i.pisValue)),
						cofins_value: this.sharedService.sum(
							mapItems.map((i) => i.cofinsValue),
						),
						iss_value: this.sharedService.sum(mapItems.map((i) => i.issValue)),
						base_value: this.sharedService.sum(mapItems.map((i) => i.issBase)),
						percentage_value: issPercentage,
						discount_value: this.sharedService.sum(
							mapItems.map((i) => i.discountValue),
						),
						service_code: serviceCode,
						cnae: authCtx.unit.cnae ?? "",
						description: authCtx.unit.unitConfig.defaultNfseDescription ?? "-",
						city_code: authCtx.unit.cityCode ?? "",
					},
				},
				token,
				{
					hideCnae:
						authCtx.unit.unitConfig.config.fiscalDocuments?.nfse_hide_cnae,
					hideCityCode:
						authCtx.unit.unitConfig.config.fiscalDocuments
							?.nfse_hide_codigo_tributario_municipio,
				},
			);

			await BillItem.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					mapItems.map((i) => i.id),
				)
				.update({
					nfe_issued: result.success,
				});

			await serviceDocument
				.merge({
					rpsNumber: result.data?.numero_rps,
					rpsSeries: result.data?.serie_rps.toString(),
					status: result.data?.status,
					errors: result.data?.erros,
				})
				.useTransaction(trx)
				.save();

			await serviceDocument.related("items").createMany(
				mapItems.map((item) => ({
					bill_item_id: item.id,
				})),
				{ client: trx },
			);

			return result;
		});

		const results = await Promise.all(tasks);
		return results.filter((r) => !r.success);
	}

	public static async UpdateOldNfeRecords() {
		const focus = new FocusNfeService();

		const rowsToUpdate: {
			id: string;
			disabling_receipt: string | null;
			bill_id: string | null;
			fiscal_document_environment: string | null;
			focus_homologation_token: string | null;
			focus_production_token: string | null;
		}[] = await Database.from("issued_fiscal_documents")
			.select(
				Database.raw(`issued_fiscal_documents.id,
       issued_fiscal_documents.disabling_receipt,
       issued_fiscal_documents.bill_id,
       business_unit_configs.fiscal_document_environment,
       business_unit_configs.focus_homologation_token,
       business_unit_configs.focus_production_token`),
			)
			.joinRaw(
				"join business_unit_configs on business_unit_configs.business_unit_id = issued_fiscal_documents.business_unit_id",
			)
			.whereRaw(
				"(issued_fiscal_documents.cancellation_date is not null and issued_fiscal_documents.cancellation_receipt_date is null)",
			)
			.whereRaw(
				"(business_unit_configs.focus_homologation_token is not null or business_unit_configs.focus_homologation_token is not null)",
			)
			.orderByRaw("issued_fiscal_documents.created_at desc");

		const tasks = rowsToUpdate
			.filter(
				(row) => !!row.focus_production_token || !!row.focus_homologation_token,
			)
			.map(async (row) => {
				const token =
					row.fiscal_document_environment === "H"
						? row.focus_homologation_token
						: row.fiscal_document_environment;
				if (!token) {
					return { [row.id]: "Sem token" };
				}

				const result = await focus.getNfe(row.id, token);
				if (!result.success) {
					return {
						[row.id]: {
							msg: "Falha ao pegar resultados da focus",
							result,
						},
					};
				}

				const urlPrefix =
					row.fiscal_document_environment === "P"
						? "https://api.focusnfe.com.br"
						: "https://homologacao.focusnfe.com.br";

				await IssuedFiscalDocument.query()
					.where("id", row.id)
					.update({
						sefaz_status: result.data.status,
						sefaz_status_code: result.data.status_sefaz,
						sefaz_message: result.data.protocolo_cancelamento
							? [
									result.data.protocolo_cancelamento.descricao_evento,
									result.data.protocolo_cancelamento.motivo,
								].join(" - ")
							: result.data.mensagem_sefaz,
						access_key: result.data.chave_nfe,
						authorization_xml_path: [
							urlPrefix,
							result.data.caminho_xml_nota_fiscal,
						].join(""),
						authorization_pdf_path: [urlPrefix, result.data.caminho_danfe].join(
							"",
						),
						cancellation_xml_path: [
							urlPrefix,
							result.data.caminho_xml_cancelamento,
						].join(""),

						authorization_receipt:
							result.data.protocolo_nota_fiscal?.numero_protocolo,
						authorization_receipt_date: result.data.protocolo_nota_fiscal
							?.data_recebimento
							? DateTime.fromISO(
									result.data.protocolo_nota_fiscal?.data_recebimento,
								)
							: undefined,

						cancellation_receipt:
							result.data.protocolo_cancelamento?.numero_protocolo,
						cancellation_receipt_date: result.data.protocolo_cancelamento
							?.data_evento
							? DateTime.fromISO(
									result.data.protocolo_cancelamento?.data_evento,
								)
							: undefined,
					});
				if (row.disabling_receipt && row.bill_id) {
					await BillItem.query()
						.where("bill_id", row.bill_id)
						.update({ nfeIssued: false } as Partial<BillItem>);
				}

				return {
					[row.id]: {
						msg: "Atualizado com sucesso",
						result,
						atualizouBillItem: {
							disabling: row.disabling_receipt,
							bill_id: row.bill_id,
						},
						campos: {
							sefaz_status: result.data.status,
							sefaz_status_code: result.data.status_sefaz,
							sefaz_message: result.data.protocolo_cancelamento
								? [
										result.data.protocolo_cancelamento.descricao_evento,
										result.data.protocolo_cancelamento.motivo,
									].join(" - ")
								: result.data.mensagem_sefaz,
							access_key: result.data.chave_nfe,
							authorization_xml_path: [
								urlPrefix,
								result.data.caminho_xml_nota_fiscal,
							].join(""),
							authorization_pdf_path: [
								urlPrefix,
								result.data.caminho_danfe,
							].join(""),
							cancellation_xml_path: [
								urlPrefix,
								result.data.caminho_xml_cancelamento,
							].join(""),

							authorization_receipt:
								result.data.protocolo_nota_fiscal?.numero_protocolo,
							authorization_receipt_date: result.data.protocolo_nota_fiscal
								?.data_recebimento
								? DateTime.fromISO(
										result.data.protocolo_nota_fiscal?.data_recebimento,
									)
								: "NÃO FOI SETADO",

							cancellation_receipt:
								result.data.protocolo_cancelamento?.numero_protocolo,
							cancellation_receipt_date: result.data.protocolo_cancelamento
								?.data_evento
								? DateTime.fromISO(
										result.data.protocolo_cancelamento?.data_evento,
									)
								: "NÃO FOI SETADO",
						},
					},
				};
			});
		return await Promise.all(tasks);
	}

	public static async UpdateOldNfseRecords() {
		const focus = new FocusNfeService();

		const rowsToUpdate: {
			id: string;
			bill_id: string | null;
			fiscal_document_environment: string | null;
			focus_homologation_token: string | null;
			focus_production_token: string | null;
		}[] = await Database.from("service_issued_fiscal_documents")
			.select(
				Database.raw(`service_issued_fiscal_documents.id,
       service_issued_fiscal_documents.bill_id,
       business_unit_configs.fiscal_document_environment,
       business_unit_configs.focus_homologation_token,
       business_unit_configs.focus_production_token`),
			)
			.joinRaw(
				"join business_unit_configs on business_unit_configs.business_unit_id = service_issued_fiscal_documents.business_unit_id",
			)
			.whereRaw("service_issued_fiscal_documents.authorization_receipt is null")
			.whereRaw(`(service_issued_fiscal_documents.cancellation_date is not null and
       service_issued_fiscal_documents.cancellation_receipt_date is null)`)
			.whereRaw("service_issued_fiscal_documents.deleted_at is null")
			.whereRaw(
				"(business_unit_configs.focus_homologation_token is not null or business_unit_configs.focus_homologation_token is not null)",
			)
			.orderByRaw("service_issued_fiscal_documents.created_at desc");

		const tasks = rowsToUpdate
			.filter(
				(row) => !!row.focus_production_token || !!row.focus_homologation_token,
			)
			.map(async (row) => {
				const token =
					row.fiscal_document_environment === "H"
						? row.focus_homologation_token
						: row.fiscal_document_environment;
				if (!token) {
					return { [row.id]: "Sem token" };
				}

				const result = await focus.getNfse(row.id, token);
				if (!result.success) {
					return {
						[row.id]: {
							msg: "Falha ao pegar resultados da focus",
							result,
						},
					};
				}

				// const urlPrefix =
				// 	row.fiscal_document_environment === "P"
				// 		? "https://api.focusnfe.com.br"
				// 		: "https://homologacao.focusnfe.com.br";

				await ServiceIssuedFiscalDocument.query()
					.where("id", row.id)
					.update({
						status: result.data.status,
						sequence: result.data.numero,
						rpsNumber: result.data.numero_rps,
						rpsSeries: result.data.serie_rps.toString(),
						rpsType: result.data.tipo_rps,
						verificationCode: result.data.codigo_verificacao,
						errors: JSON.stringify(result.data.erros),
						authorizationDate:
							result.data.status === "autorizado" ? DateTime.now() : undefined,
						cancellationDate:
							result.data.status === "cancelado" ? DateTime.now() : undefined,
						mirrorPath: result.data.url,
						authorizationPdfPath: result.data.url_danfse,
						authorizationXmlPath: result.data.caminho_xml_nota_fiscal,
					});
				// if (row.disabling_receipt && row.bill_id) {
				// 	await BillItem.query()
				// 		.where("bill_id", row.bill_id)
				// 		.update({ nfeIssued: false } as Partial<BillItem>);
				// }

				return {
					[row.id]: {
						msg: "Atualizado com sucesso",
						result,
						// atualizouBillItem: {
						// 	disabling: row.disabling_receipt,
						// 	bill_id: row.bill_id,
						// },
						campos: {
							status: result.data.status,
							sequence: result.data.numero,
							rpsNumber: result.data.numero_rps,
							rpsSeries: result.data.serie_rps.toString(),
							rpsType: result.data.tipo_rps,
							verificationCode: result.data.codigo_verificacao,
							errors: JSON.stringify(result.data.erros),
							authorizationDate:
								result.data.status === "autorizado"
									? DateTime.now()
									: undefined,
							cancellationDate:
								result.data.status === "cancelado" ? DateTime.now() : undefined,
							mirrorPath: result.data.url,
							authorizationPdfPath: result.data.url_danfse,
							authorizationXmlPath: result.data.caminho_xml_nota_fiscal,
						},
					},
				};
			});
		return await Promise.all(tasks);
	}

	async updateFromFocus(unitId: string, id: string) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const document = await IssuedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", group.id)
				.where("business_unit_id", unitId)
				.where("id", id)
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", document.business_unit_id)
				.preload("unitConfig")
				.firstOrFail();

			const token = this.getToken(unit);

			const result = await this.focusNfe.getNfe(document.id, token);
			if (!result.success) {
				throw new BadRequestException(result.error, 400, "E_NO_NOTE");
			}

			const updated = await this.mergeNfe(
				document,
				result.data,
				unit.unitConfig.fiscalDocumentEnvironment,
			)
				.useTransaction(trx)
				.save();
			if (updated.disablingReceipt) {
				await BillItem.query()
					.where("bill_id", updated.bill_id)
					.update({ nfeIssued: false } as Partial<BillItem>);
			}
		});
	}

	async updateNfseFromFocus(unitId: string, id: string) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const document = await ServiceIssuedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", group.id)
				.where("business_unit_id", unitId)
				.where("id", id)
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", document.business_unit_id)
				.preload("unitConfig")
				.firstOrFail();

			const token = this.getToken(unit);

			const result = await this.focusNfe.getNfse(document.id, token);
			if (!result.success) {
				throw new BadRequestException(
					"Erro ao atualizar nota",
					400,
					"E_NO_NOTE",
				);
			}

			await this.mergeNfse(document, result.data).useTransaction(trx).save();
		});
	}

	async updateFromFocusWithWebhook(id: string) {
		return Database.transaction(async (trx) => {
			const document = await IssuedFiscalDocument.query({
				client: trx,
			})
				.where("id", id)
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", document.business_unit_id)
				.preload("unitConfig")
				.firstOrFail();

			const token = this.getToken(unit);

			const result = await this.focusNfe.getNfe(document.id, token);
			if (!result.success) {
				throw new BadRequestException(
					"Erro ao atualizar nova",
					400,
					"E_NO_NOTE",
				);
			}

			const updated = await this.mergeNfe(
				document,
				result.data,
				unit.unitConfig.fiscalDocumentEnvironment,
			)
				.useTransaction(trx)
				.save();

			if (updated.disablingReceipt) {
				await BillItem.query()
					.where("bill_id", updated.bill_id)
					.update({ nfeIssued: false } as Partial<BillItem>);
			}
		});
	}

	async updateNfseFromFocusWithWebhook(id: string) {
		return Database.transaction(async (trx) => {
			const document = await ServiceIssuedFiscalDocument.query({
				client: trx,
			})
				.where("id", id)
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", document.business_unit_id)
				.preload("unitConfig")
				.firstOrFail();

			const token = this.getToken(unit);

			const result = await this.focusNfe.getNfse(document.id, token);
			if (!result.success) {
				throw new BadRequestException(
					"Erro ao atualizar nova",
					400,
					"E_NO_NOTE",
				);
			}

			await this.mergeNfse(document, result.data).useTransaction(trx).save();
		});
	}

	async disableFromWebhook(data: unknown) {
		const result = disableWebhookResponseSchema.safeParse(data);
		Logger.info(JSON.stringify(data, undefined, 2));

		if (!result.success) {
			Logger.error("invalid body");
			Logger.error(JSON.stringify(result.error.issues, undefined, 2));
			return;
		}

		await Database.transaction(async (trx) => {
			const issuedDocument = await IssuedFiscalDocument.query()
				.useTransaction(trx)
				.where("model", result.data.modelo)
				.where("series", result.data.serie)
				.where("sequence", result.data.numero_inicial)
				.whereHas("unit", (query) => {
					query.where("document", result.data.cnpj);
				})
				.first();
			if (!issuedDocument) {
				Logger.error("documento não encontrado");
				return;
			}

			await issuedDocument
				.merge({
					sefazStatus: "Inutilizado",
					sefazStatusCode: result.data.status_sefaz,
					sefazMessage: result.data.mensagem_sefaz,
					disablingXmlPath: result.data.caminho_xml,
					disablingReceipt: issuedDocument.disablingReceipt
						? issuedDocument.disablingReceipt
						: result.data.protocolo_sefaz,
					disablingReceiptDate: issuedDocument.disablingReceiptDate
						? issuedDocument.disablingReceiptDate
						: DateTime.now(),
				})
				.useTransaction(trx)
				.save();

			await BillItem.query()
				.useTransaction(trx)
				.where("bill_id", issuedDocument.bill_id)
				.whereHas("productVariation", (query) => {
					query.whereHas("product", (query) => {
						query.where("type", ProductType.PRODUCT);
					});
				})
				.update({ nfeIssued: false } as Partial<BillItem>);
		});
	}

	async cancelNfe(unitId: string, user: User, data: ICancelFiscalDocument) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", unitId)
				.preload("unitConfig")
				.firstOrFail();

			const token = this.getToken(unit);

			const document = await IssuedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", group.id)
				.where("business_unit_id", unitId)
				.where("id", data.issuedDocumentId)
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			if (
				!document.accessKey || // 2.15.5.1
				!document.authorizationReceipt || // 2.15.5.2
				!document.authorizationDate || // 2.15.5.3
				!!document.cancellationDate || // 2.15.5.4
				!!document.disablingReceipt // 2.15.5.5
			) {
				throw new BadRequestException(
					"Documento em estado inválido",
					400,
					"E_INVALID_STATE",
				);
			}

			const cancelResult = await this.focusNfe.cancelNfe(
				document.id,
				data.reason,
				token,
			);
			if (!cancelResult) {
				throw new BadRequestException(
					"Erro ao cancelar nota fiscal",
					400,
					"E_EXTERNAL_ERROR",
				);
			}

			// const getResult = await this.focusNfe.getNfe(document.id);
			// if (!getResult) {
			//   throw new BadRequestException(
			//     'Erro ao atualizar nova',
			//     400,
			//     'E_NO_NOTE',
			//   );
			// }

			await document
				.merge({
					user_who_cancelled_id: user.id,
					cancellationDate: DateTime.now(),
					cancellationReason: data.reason,
					sefazStatus: cancelResult?.status ?? "Cancelado",
					sefazStatusCode: cancelResult?.status_sefaz ?? "-",
					sefazMessage: cancelResult?.mensagem_sefaz ?? "Cancelado",
					// cancellationXmlPath: cancelResult.caminho_xml_cancelamento,
					// cancellationReceiptDate: getResult.protocolo_cancelamento
					//   ? DateTime.fromISO(getResult.protocolo_cancelamento.data_evento)
					//   : undefined,
					// cancellationReceipt:
					//   getResult.protocolo_cancelamento?.numero_protocolo,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async cancelNfse(unitId: string, user: User, data: ICancelFiscalDocument) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const document = await ServiceIssuedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", group.id)
				.where("business_unit_id", unitId)
				.where("id", data.issuedDocumentId)
				.preload("items", (query) => {
					query.preload("billItem");
				})
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", unitId)
				.preload("unitConfig")
				.firstOrFail();

			const token = this.getToken(unit);

			const cancelResult = await this.focusNfe.cancelNfse(
				document.id,
				data.reason,
				token,
			);
			if (!cancelResult) {
				throw new BadRequestException(
					"Erro ao cancelar nota fiscal",
					400,
					"E_EXTERNAL_ERROR",
				);
			}

			const tasks = document.items.map((item) =>
				item.billItem
					.merge({
						nfeIssued: cancelResult.status !== "cancelado",
					})
					.useTransaction(trx)
					.save(),
			);
			await Promise.all(tasks);

			await document
				.merge({
					status: cancelResult.status,
					user_who_cancelled_id: user.id,
					cancellationDate: DateTime.now(),
					cancellationReason: data.reason,
					// @ts-expect-error json asd
					errors: JSON.stringify(data.erros),

					// sefazStatus: cancelResult.status_sefaz,
					// sefazMessage: cancelResult.mensagem_sefaz,
					// cancellationXmlPath: cancelResult.caminho_xml_cancelamento,
					// cancellationReceiptDate: getResult.protocolo_cancelamento
					//   ? DateTime.fromISO(getResult.protocolo_cancelamento.data_evento)
					//   : undefined,
					// cancellationReceipt:
					//   getResult.protocolo_cancelamento?.numero_protocolo,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async disable(unitId: string, user: User, data: IDisableFiscalDocument) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const unit = await BusinessUnit.query()
				.useTransaction(trx)
				.where("id", unitId)
				.preload("unitConfig")
				.firstOrFail();

			const token = this.getToken(unit);

			const document = await IssuedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", group.id)
				.where("business_unit_id", unitId)
				.where("id", data.issuedDocumentId)
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			if (
				!!document.accessKey || // 2.16.5.2
				!!document.authorizationReceipt || // 2.16.5.3
				!!document.cancellationReceipt || // 2.16.5.5
				!!document.disablingReceipt // 2.16.5.6
			) {
				throw new BadRequestException(
					"Documento em estado inválido",
					400,
					"E_INVALID_STATE",
				);
			}

			const result = await this.focusNfe.disable(
				document.id,
				{
					cnpj: unit.document ?? "",
					series: document.series,
					sequence: document.sequence,
					reason: data.reason,
				},
				token,
			);

			if (!result.success) {
				throw new BadRequestException(
					"Erro ao cancelar nota fiscal",
					400,
					"E_EXTERNAL_ERROR",
				);
			}

			await document
				.merge({
					sefazStatus: "Inutilizado",
					user_who_disabled_id: user.id,
					disablingDate: DateTime.now(),
					disablingReason: data.reason,
					disablingReceiptDate: DateTime.now(),
					disablingReceipt: result.data?.protocolo_sefaz,
					// sefazStatus: result.status_sefaz,
					// sefazMessage: result.mensagem_sefaz,
					// disablingXmlPath: result.caminho_xml,
					// disablingReceipt: result.protocolo_sefaz,
				})
				.useTransaction(trx)
				.save();

			await BillItem.query()
				.useTransaction(trx)
				.where("bill_id", document.bill_id)
				.whereHas("productVariation", (query) => {
					query.whereHas("product", (query) => {
						query.where("type", ProductType.PRODUCT);
					});
				})
				.update({ nfeIssued: false } as Partial<BillItem>);
		});
	}

	async correct(unitId: string, user: User, data: ICorrectFiscalDocument) {
		const group = await this.sharedService.getUserGroup(unitId);

		return Database.transaction(async (trx) => {
			const document = await IssuedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", group.id)
				.where("business_unit_id", unitId)
				.where("id", data.issuedDocumentId)
				.first();

			if (!document) {
				throw this.sharedService.ResourceNotFound();
			}

			if (
				!document.accessKey || // 2.17.5.1
				!document.authorizationReceipt || // 2.17.5.2
				!document.authorizationReceiptDate || // 2.17.5.3
				!!document.cancellationReceipt || // 2.17.5.4
				!!document.disablingReceipt // 2.17.5.5
			) {
				throw new BadRequestException(
					"Documento em estado inválido",
					400,
					"E_INVALID_STATE",
				);
			}

			const count = await CorrectedFiscalDocument.query({
				client: trx,
			})
				.where("economic_group_id", group.id)
				.where("business_unit_id", unitId)
				.where("fiscal_document_id", document.id);

			await CorrectedFiscalDocument.create(
				{
					economic_group_id: group.id,
					business_unit_id: unitId,
					fiscal_document_id: document.id,
					correctionNumber: (count.length + 1).toString(),
					user_id: user.id,
					correctedDate: DateTime.now(),
					description: data.reason,
				},
				{
					client: trx,
				},
			);

			// TODO call external service
		});
	}

	async listReceived(authCtx: AuthContext) {
		return this.focusNfe.listReceived(
			authCtx.unit.document ?? "-",
			this.getToken(authCtx.unit),
		);
	}

	async searchReceived(authCtx: AuthContext, ref: string) {
		return this.focusNfe.searchReceived(
			ref,
			this.getToken(authCtx.unit),
			"pdf",
		);
	}

	async importReceived(authCtx: AuthContext, ref: string) {
		const rawString = await this.focusNfe.searchReceived(
			ref,
			this.getToken(authCtx.unit),
			"xml",
		);

		const receiptXml = await ReceiptXml.create({
			economic_group_id: authCtx.group.id,
			business_unit_id: authCtx.unit.id,
			user_id: authCtx.user.id,
			// receipt_id: newReceipt.id,
			// xmlFile: s3Key,
		});

		await this.receiptService.processReceipt(authCtx, rawString, receiptXml);
	}

	private mergeNfe(
		document: IssuedFiscalDocument,
		data: z.infer<typeof nfeResponseSchema>,
		env: string,
	) {
		const urlPrefix =
			env === "P"
				? "https://api.focusnfe.com.br"
				: "https://homologacao.focusnfe.com.br";

		return document.merge({
			sefazStatus:
				document.sefazStatus === "Inutilizado"
					? document.sefazStatus
					: data.status,
			sefazStatusCode: data.status_sefaz,
			sefazMessage: data.protocolo_cancelamento
				? [
						data.protocolo_cancelamento.descricao_evento,
						data.protocolo_cancelamento.motivo,
					].join(" - ")
				: data.mensagem_sefaz,
			accessKey: data.chave_nfe,
			authorizationXmlPath: [urlPrefix, data.caminho_xml_nota_fiscal].join(""),
			authorizationPdfPath: [urlPrefix, data.caminho_danfe].join(""),
			cancellationXmlPath: [urlPrefix, data.caminho_xml_cancelamento].join(""),

			authorizationReceipt: data.protocolo_nota_fiscal?.numero_protocolo,
			authorizationReceiptDate: data.protocolo_nota_fiscal?.data_recebimento
				? DateTime.fromISO(data.protocolo_nota_fiscal?.data_recebimento)
				: undefined,

			cancellationReceipt: data.protocolo_cancelamento?.numero_protocolo,
			cancellationReceiptDate: data.protocolo_cancelamento?.data_evento
				? DateTime.fromISO(data.protocolo_cancelamento?.data_evento)
				: undefined,
		});
	}

	private mergeNfse(
		document: ServiceIssuedFiscalDocument,
		data: z.infer<typeof nfseResponseSchema>,
	) {
		return document.merge({
			status: data.status,
			sequence: data.numero,
			rpsNumber: data.numero_rps,
			rpsSeries: data.serie_rps.toString(),
			rpsType: data.tipo_rps,
			verificationCode: data.codigo_verificacao,
			// @ts-expect-error json asd
			errors: JSON.stringify(data.erros),
			authorizationDate:
				data.status === "autorizado" ? DateTime.now() : undefined,
			cancellationDate:
				data.status === "cancelado" ? DateTime.now() : undefined,
			mirrorPath: data.url,
			authorizationPdfPath: data.url_danfse,
			authorizationXmlPath: data.caminho_xml_nota_fiscal,
		});
	}

	private getToken(unit: BusinessUnit) {
		if (
			!unit.unitConfig?.focusHomologationToken &&
			!unit.unitConfig?.focusProductionToken
		) {
			throw new BadRequestException(
				"Não foi possível autorizar a nota fiscal, pois a unidade não possui um token de acesso ao FocusNFe",
			);
		}

		return unit.unitConfig.fiscalDocumentEnvironment === "H"
			? unit.unitConfig.focusHomologationToken
			: unit.unitConfig.focusProductionToken;
	}

	static ICMS_CEST_VALUES = [
		"10",
		"30",
		"60",
		"70",
		"201",
		"202",
		"203",
		"500",
	];

	// private async calculateCest(item: BillItem) {
	// 	if (
	// 		!BusinessUnitFiscalDocumentService.ICMS_CEST_VALUES.includes(item.icmsCst)
	// 	) {
	// 		return "";
	// 	}
	//
	// 	const { product } = item.productVariation;
	//
	// 	if (product.cest && product.cest.length > 0) {
	// 		return product.cest.replace(/\D/g, "");
	// 	}
	//
	// 	const cestRows = await Cest.query()
	// 		.whereILike(
	// 			"ncm",
	// 			`${product.ncm?.replace(/\D/g, "").substring(0, 4) ?? ""}%`,
	// 		)
	// 		.orderByRaw("length(ncm) desc");
	//
	// 	if (cestRows.length === 0) {
	// 		return "";
	// 	}
	//
	// 	return cestRows.at(0)?.cest?.replace(/\D/g, "") ?? "";
	// }

	private calcCode(
		issuedDocument: IssuedFiscalDocument,
		tutor: PatientTutor,
	): ISendNfe["buyer"]["code"] {
		if (issuedDocument.model === "65") {
			return "9";
		}

		const clearDoc = tutor.document?.replaceAll(/\D/g, "") ?? "";

		if (clearDoc.length === 11) {
			return "9";
		}

		// É CNPJ

		if (tutor.inscription?.toUpperCase() === "NC") {
			return "9";
		}

		if (tutor.inscription?.toUpperCase() === "ISENTO") {
			return "2";
		}

		return "1";
	}
}
