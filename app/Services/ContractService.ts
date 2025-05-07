import { inject } from "@adonisjs/fold";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import Bill, { BillStatus } from "App/Models/Bill";
import BillItem, { BillItemStatus } from "App/Models/BillItem";
import BillPayment from "App/Models/BillPayment";
import Finance, {
	FinanceAccept,
	FinanceOriginFlag,
	FinanceStatus,
	FinanceType,
} from "App/Models/Finance";
import Patient from "App/Models/Patient";
import PatientContract from "App/Models/PatientContract";
import PaymentMethod from "App/Models/PaymentMethod";
import { ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import TaxationGroupRule, {
	CompanyType,
	MovementCategory,
	MovementType,
} from "App/Models/TaxationGroupRule";
import UfIcms from "App/Models/UfIcms";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { GenerateTag } from "App/Utils/GenerateTag";
import { endOfMonth } from "date-fns";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { validate } from "uuid";

@inject()
export default class ContractService {
	constructor(private sharedService: SharedService) {}

	public async forPatient(authCtx: AuthContext, patientID: string) {
		if (!authCtx.hasPermission("CON00")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		if (!validate(patientID)) {
			throw new BadRequestException("ID inválido de paciente", 400, "E_ERR");
		}

		const patient = await Patient.query().where("id", patientID).firstOrFail();

		const contracts = await PatientContract.query()
			.preload("product")
			.preload("paymentMethod")
			.preload("tefFlag")
			.preload("tefAcquirer")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("patient_id", patientID);

		return {
			id: patient.id,
			name: patient.name,
			contracts: contracts.map((row) => ({
				id: row.id,
				product_id: row.product_id,
				product_description: row.product.description,
				product_variation_id: row.product_variation_id,
				business_unit_product_id: row.business_unit_product_id,
				quantity: row.quantity,
				unitary_value: row.unitaryValue,
				promotional_value: row.promotionalValue,
				promotional_value_expiration: row.promotionalValueExpiration,
				payment_method_id: row.payment_method_id,
				payment_method_description: row.paymentMethod.description,
				payment_method_tef_flag_id: row.payment_method_tef_flag_id,
				payment_method_tef_flag_description: row.tefFlag?.description ?? null,
				payment_method_tef_acquirer_id: row.payment_method_tef_acquirer_id,
				payment_method_tef_acquirer_description:
					row.tefAcquirer?.description ?? null,
				expiration_day: row.expirationDay,
				active: row.active,
			})),
		};
	}

	public async index(authCtx: AuthContext, data: {}) {
		if (!authCtx.hasPermission("CON00")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		const rows: {
			economic_group_id: string;
			businness_unit_id: string;
			pid: string;
			pvid: string;
			bupid: string;
			price: string;
		}[] = await Database.from("products")
			.select(
				Database.raw(`products.economic_group_id,
       business_unit_products.businness_unit_id,
       products.id               as pid,
       product_variations.id     as pvid,
       business_unit_products.id as bupid,
       business_unit_products.price`),
			)
			.joinRaw(
				"join product_variations on products.id = product_variations.product_id",
			)
			.joinRaw(
				"join business_unit_products on product_variations.id = business_unit_products.product_variation_id",
			)
			.whereRaw("products.economic_group_id = ?", [authCtx.group.id])
			.whereRaw("products.type = 'service'", [])
			.whereRaw("products.contract in ('S', 'A')", [])
			.whereRaw("products.active is true", [])
			.whereRaw("products.deleted_at is null", [])
			.whereRaw("product_variations.deleted_at is null", [])
			.whereRaw("business_unit_products.deleted_at is null", []);

		return rows.map((r) => ({
			economic_group_id: r.economic_group_id,
			business_unit_id: r.businness_unit_id,
			product_id: r.pid,
			product_variation_id: r.pvid,
			business_unit_product_id: r.businness_unit_id,
			unitary_value: r.price,
		}));
	}

	public async storeClientContract(
		authCtx: AuthContext,
		data: {
			clientId: string;
			patientId?: string;
			sellerId: string;
			billDate: DateTime;
			dailyMovementId: string;
			dailyCashierId: string;
			items: {
				productId: string;
				productVariationId: string;
				businessUnitProductId: string;
				quantity: number;
				unitaryValue: number;
				discountValue: number;
				saleValue: number;
				paymentMethodId: string;
				paymentMethodTefFlagId: string;
				paymentMethodTefAcquirerId: string;
				paymentExpirationDay: number;
			}[];
		},
	) {
		if (!authCtx.hasPermission("CON04")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		return Database.transaction(async (trx) => {
			const paymentMethods = await PaymentMethod.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map((r) => r.paymentMethodId),
				);

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

			const bill = await Bill.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					user_id: authCtx.user.id,
					seller_id: authCtx.user.id,
					daily_movement_id: data.dailyMovementId,
					daily_cashier_id: data.dailyCashierId,
					financial_responsible_id: data.clientId,
					client_id: data.clientId,
					patient_id: data.patientId,
					user_who_closed_id: authCtx.user.id,
					// origin_bill_id: data.originBillId,

					internalCode: "",
					// pending: data.items.some((i) => i.courtesy || i.maxDiscount),
					pending: false,
					billDate: data.billDate,
					productValue: 0,
					serviceValue: 0,
					discountValue: 0,
					totalValue: 0,
					deliveryValue: 0,
					// additionalInformation: data.additionalInformation,
					status: BillStatus.B,
					documentStatus: "Não Gerados",
					closingDate: DateTime.now(),

					otherValue: 0,
					tag: GenerateTag(
						Number.parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1,
					),
				},
				{
					client: trx,
				},
			);

			const tasks = data.items.map(async (item) => {
				const variation = productVariations.find(
					(variation) => variation.id === item.productVariationId,
				) as ProductVariation;

				const rule = taxRules.find(
					(rule) =>
						rule.taxationGroup.id === variation.product.taxation_group_id,
				);
				if (!rule) {
					throw new BadRequestException(
						`Nenhuma regra de imposto encontrada para o produto: ${variation.product.description}`,
						400,
						"E_ERR",
					);
				}

				const ufIcmsRule = ufIcms.find(
					(ufIcms) =>
						ufIcms.originUf === rule?.toUf &&
						ufIcms.destinationUf === rule?.toUf,
				);

				const totalValue =
					item.unitaryValue * item.quantity - item.discountValue;
				const icmsBase =
					totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
				const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;
				const icmsStBase_1 = this.isValidNumber(rule?.ivaIcmsSt)
					? icmsBase + (icmsBase * rule.ivaIcmsSt) / 100
					: 0;
				const icmsStPercentageRedBase = this.isValidNumber(rule?.ivaIcmsSt)
					? rule.icmsPercRedBaseCalculoST
					: undefined;
				const icmsStBase_2 = this.isValidNumber(rule?.ivaIcmsSt)
					? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
					: 0;

				return await BillItem.create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						bill_id: bill.id,
						product_variation_id: item.productVariationId,
						tax_rule_id: rule?.id,
						deposit_id: undefined,
						courtesy_issued_user_id: undefined,

						// courtesy: item.courtesy,
						// maxDiscount: item.maxDiscount,
						quantity: new Decimal(item.quantity),
						costValue: item.unitaryValue,
						saleValue: item.saleValue,
						unitaryValue: item.unitaryValue,
						discountValue: item.discountValue,
						totalValue: totalValue,
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
			});

			const existingItems = await Promise.all(tasks);

			const updatedBillWithValues = await this.syncBillPendingAndSum(trx, bill);

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
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
						)
						.reduce((acc, item) => acc + item.icmsStBase, 0),
					icmsStValue: existingItems
						.filter(
							(i) =>
								typeof i.icmsStValue === "number" &&
								!Number.isNaN(i.icmsStValue),
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

			await authCtx.unit.unitConfig
				.merge({
					billCounter: (
						Number.parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1
					).toString(),
				})
				.useTransaction(trx)
				.save();

			const newPayments = await BillPayment.createMany(
				this.uniqueLists(
					data.items.map((r) => [
						r.paymentMethodId,
						r.paymentMethodTefFlagId,
						r.paymentMethodTefAcquirerId,
						r.paymentExpirationDay.toString(),
					]),
				).map<Partial<BillPayment>>((r) => {
					const installment = {
						fee: paymentMethods.find((pm) => pm.id === r[0])?.fee ?? -1,
						installment: 1,
					};

					return {
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						bill_id: bill.id,
						payment_method_id: r[0],
						tef_acquirer_id: r[2],
						tef_flag_id: r[1],
						daily_cashier_id: data.dailyCashierId,
						// budget_payment_id: data.budgetPaymentId,

						pending: false,
						block: 1,
						// expirationDate: SharedService.CalculateDateOffset(
						// 	v,
						// 	data.expirationDate,
						// 	paymentMethod,
						// ),
						// feeType:
						// 	paymentMethod.fee > 0 ? BillPaymentFeeType.S : BillPaymentFeeType.N,
						feeValue: 0,
						feePercentage: 0,
						installments: 1,
						installmentValue: updatedBillWithValues.serviceValue,
						totalValue: updatedBillWithValues.serviceValue,
						paymentMethodDiscountPercentage: installment.fee,
						paymentMethodDiscountValue:
							(updatedBillWithValues.serviceValue * installment.fee) / 100,
						qtyInstallments: 1,
					};
				}),
				{ client: trx },
			);

			await Finance.createMany(
				newPayments.map<Partial<Finance>>((r) => {
					const installmentValue = r.totalValue;

					return {
						user_id: authCtx.user.id,
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						daily_movement_id: bill.daily_movement_id,
						daily_cashier_id: bill.daily_cashier_id,
						client_id: bill.financial_responsible_id ?? bill.client_id,
						payment_method_id: r.payment_method_id ?? undefined,
						origin_id: r.id,
						account_plan_id: authCtx.unit.unitConfig.sale_exit_account_plan_id,

						internalCode: bill.internalCode,
						type: FinanceType.C,
						installment: 1,
						block: 1,
						originFlag: FinanceOriginFlag.S,
						document: `NFS-${bill.tag}`,
						historic: `NFS-${bill.tag}`,
						issueDate: DateTime.now(),
						discountValue: 0,
						discountPercentage: 0,
						expirationDate: r.expirationDate,
						originalValue: installmentValue,
						value:
							installmentValue -
							(installmentValue * r.paymentMethodDiscountPercentage) / 100,
						totalValue:
							installmentValue -
							(installmentValue * r.paymentMethodDiscountPercentage) / 100,
						feeDiscountValue:
							(r.installmentValue ?? 0) -
							(installmentValue -
								(installmentValue * r.paymentMethodDiscountPercentage) / 100),
						feeValue: 0,
						// feeDiscountPercentage: paymentMethod.fee,
						feeDiscountPercentage: r.paymentMethodDiscountPercentage,
						accept: FinanceAccept.N,
						reconciled: authCtx.unit.unitConfig.balanceControl === "previsto",
						competenceDate: DateTime.now().toFormat("MM/yyyy"),
						nsuDocument: r.nsuDocument,
						tef_flag_id: r.tef_flag_id,
						acquirer_id: r.tef_acquirer_id,
						status: FinanceStatus.A,
						qtyInstallments: 1,
					};
				}),
				{
					client: trx,
				},
			);
		});
	}

	public async store(
		authCtx: AuthContext,
		data: {
			patientId: string;
			productId: string;
			productVariationId: string;
			businessUnitProductId: string;
			paymentMethodId: string;
			paymentMethodTefFlagId?: string;
			paymentMethodTefAcquirerId?: string;

			quantity: number;
			unitaryValue: number;
			promotionalValue: number;
			promotionalValueExpiration: string;
			expirationDay: number;
		},
	) {
		if (!authCtx.hasPermission("CON01")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		const [month, year] = data.promotionalValueExpiration.split("/");
		const expiration = endOfMonth(new Date(`${year}/${month}/10`));

		return PatientContract.create({
			economic_group_id: authCtx.group.id,
			business_unit_id: authCtx.unit.id,
			patient_id: data.patientId,
			product_id: data.productId,
			product_variation_id: data.productVariationId,
			business_unit_product_id: data.businessUnitProductId,
			payment_method_id: data.paymentMethodId,
			user_creation_id: authCtx.user.id,
			payment_method_tef_flag_id: data.paymentMethodTefFlagId,
			payment_method_tef_acquirer_id: data.paymentMethodTefAcquirerId,

			quantity: new Decimal(data.quantity),
			unitaryValue: data.unitaryValue,
			promotionalValue: data.promotionalValue,
			promotionalValueExpiration: expiration.toISOString(),
			expirationDay: data.expirationDay,
		});
	}

	public async update(
		authCtx: AuthContext,
		data: {
			id: number;
			paymentMethodId: string;
			paymentMethodTefFlagId?: string;
			paymentMethodTefAcquirerId?: string;

			quantity: number;
			unitaryValue: number;
			promotionalValue: number;
			promotionalValueExpiration: string;
			expirationDay: number;
			active: boolean;
		},
	) {
		if (!authCtx.hasPermission("CON02")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		return Database.transaction(async (trx) => {
			const existingContract = await PatientContract.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();
			if (!existingContract) {
				throw new ResourceNotFoundException(
					"Contrato não encontrado",
					404,
					"E_ERR",
				);
			}

			const [month, year] = data.promotionalValueExpiration.split("/");
			const expiration = endOfMonth(new Date(`${year}/${month}/10`));

			return existingContract
				.merge({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					payment_method_id: data.paymentMethodId,
					user_updated_id: authCtx.user.id,
					payment_method_tef_flag_id: data.paymentMethodTefFlagId,
					payment_method_tef_acquirer_id: data.paymentMethodTefAcquirerId,

					quantity: new Decimal(data.quantity),
					unitaryValue: data.unitaryValue,
					promotionalValue: data.promotionalValue,
					promotionalValueExpiration: expiration.toISOString(),
					expirationDay: data.expirationDay,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async delete(
		authCtx: AuthContext,
		data: {
			id: number;
		},
	) {
		if (!authCtx.hasPermission("CON03")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		return Database.transaction(async (trx) => {
			const existingContract = await PatientContract.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();
			if (!existingContract) {
				throw new ResourceNotFoundException(
					"Contrato não encontrado",
					404,
					"E_ERR",
				);
			}

			return existingContract
				.merge({
					user_exclusion_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}

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

		return await bill
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

	uniqueLists<T>(input: T[][]): T[][] {
		const seen = new Set<string>();
		const result: T[][] = [];

		for (const list of input) {
			const key = JSON.stringify(list);
			if (!seen.has(key)) {
				seen.add(key);
				result.push(list);
			}
		}

		return result;
	}
}
