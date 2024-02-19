import { test } from "@japa/runner";
import { BusinessUnitProductMetaType } from "App/Models/BusinessUnitProduct";
import { DailyCashierStatus } from "App/Models/DailyCashier";
import DailyMovement, { DailyMovementStatus } from "App/Models/DailyMovement";
import { PatientType } from "App/Models/Patient";
import PaymentMethod, { PaymentMethodTef } from "App/Models/PaymentMethod";
import { ProductPurpose, ProductType } from "App/Models/Product";
import Receipt from "App/Models/Receipt";
import TaxOperation from "App/Models/TaxOperation";
import TaxationGroup from "App/Models/TaxationGroup";
import TaxationGroupRule, {
	CompanyType,
	MovementCategory,
	MovementType,
} from "App/Models/TaxationGroupRule";
import TefAcquirer from "App/Models/TefAcquirer";
import TefFlag, { TefFlagType } from "App/Models/TefFlag";
import Unit, { UnitType } from "App/Models/Unit";
import PatientFactory from "Database/factories/PatientFactory";
import { DateTime } from "luxon";
import { generateJwtToken, userBootstrap } from "../utils";
import Database from "@ioc:Adonis/Lucid/Database";
import Decimal from "decimal.js";

test.group("Receipt resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, business, group, config } = await userBootstrap();

		const tefAcq = await TefAcquirer.create({
			economic_group_id: group.id,
			description: "any description",
		});

		const tefFlag = await TefFlag.create({
			economic_group_id: group.id,
			description: "any description",
			code: "any code",
			type: TefFlagType.A,
		});

		const paymentMethod = await PaymentMethod.create({
			economicGroupId: group.id,
			tef: PaymentMethodTef.T,
			description: "some",
		});

		const paymentMethodFlag = await paymentMethod.related("flags").create({
			economic_group_id: group.id,
			tef_flag_id: tefFlag.id,
			tef_acquirer_id: tefAcq.id,
			maxInstallments: 10,
		});

		const flagInstallment = await paymentMethodFlag
			.related("installments")
			.create({
				installment: 1,
				fee: 10,
			});

		const supplier = await PatientFactory.create();
		await supplier.merge({ type: PatientType.SUPPLIER }).save();
		await supplier.related("tutor").create({
			email: "some",
			cellphone: "some",
			telephone: "some",
			state: "PR",
		});

		const dailyMovement = await DailyMovement.create({
			business_unit_id: business.id,
			user_who_opened_id: user.id,
			openingDate: DateTime.now(),
			status: DailyMovementStatus.A,
		});

		const dailyCashier = await dailyMovement.related("cashiers").create({
			business_unit_id: dailyMovement.business_unit_id,
			user_who_opened_id: user.id,
			openingDate: DateTime.now(),
			status: DailyCashierStatus.A,
		});

		const receipt = await Receipt.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			user_id: user.id,
			seller_id: user.id,
			supplier_id: supplier.id,
			daily_movement_id: dailyMovement.id,
			daily_cashier_id: dailyCashier.id,
			paidValue: 0,
			totalValue: 0,
			status: "Aberta",
			tag: "2023_00001",
		});

		const payment = await receipt.related("payments").create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			payment_method_id: paymentMethod.id,
			tef_acquirer_id: tefAcq.id,
			tef_flag_id: tefFlag.id,

			block: 1,
			blockInstallments: 1,
			installmentValue: 10,
			issueDate: DateTime.now(),
			expirationDate: DateTime.now(),
			nsuDocument: "some document",
			status: "Ativo",
		});

		const taxation = await TaxationGroup.create({
			name: "any name",
			economic_group_id: group.id,
		});

		const operation = await TaxOperation.create({
			code: "any code",
			description: "any description",
			movementType: MovementType.E,
			movementCategory: MovementCategory.DE,
			generatesFinancial: true,
			accountingResult: true,
		});

		const rule = await TaxationGroupRule.create({
			companyType: business.simple ? CompanyType.S : CompanyType.N,
			movementType: MovementType.S,
			movementCategory: MovementCategory.NS,
			fromUf: business.state,
			toUf: business.state,
			icmsCst: "00",
			icmsPerc: 10,
			icmsPercRedAliquota: 10,
			icmsPercRedBaseCalculo: 10,
			ivaIcmsSt: 10,
			fcpPerc: 10,
			taxBenefitCode: "10",
			ipiCst: "00",
			ipiPerc: 10,
			pisCst: "01",
			pisPerc: 10,
			cofinsCst: "01",
			cofinsPerc: 10,
			tax_operation_id: operation.id,
			taxation_group_id: taxation.id,
			icmsPercRedBaseCalculoST: 10,
			icmsPercDiferimento: 10,
		});

		const unit = await Unit.create({
			name: "some name",
			tag: "some tag",
			type: UnitType.PRODUCT,
		});

		const product = await group.related("products").create({
			description: "some product",
			type: ProductType.PRODUCT,
			referenceCode: "some reference code",
			collectionYear: 2022,
			ncm: "some ncm",
			cest: "some cest",
			features: "some features",
			unit_id: unit.id,
			taxation_group_id: taxation.id,
			economic_group_id: group.id,
			active: true,
			purpose: ProductPurpose.SALE,
		});

		const variation = await product.related("variations").create({
			barcode: "123",
		});
		await variation.related("variationOptions").create({
			description: "some variation option",
			active: true,
		});

		await variation.related("businessUnitProducts").create({
			businness_unit_id: business.id,
			price: 10,
			stock: 10,
			maximumStock: 10,
			minimumStock: 10,
			maximumDiscountPercentage: 10,
			commission: 10,
			commissionMeta: 10,
			costPrice: 10,
			maximumDiscountValue: 10,
			meta: 10,
			metaType: BusinessUnitProductMetaType.Quantidade,
			profitMargin: 10,
		});

		return {
			user,
			supplier,
			dailyMovement,
			dailyCashier,
			receipt,
			rule,
			variation,
			paymentMethod,
			tefAcq,
			tefFlag,
			payment,
			business,
			group,
			taxation,
			unit,
			paymentMethodFlag,
			flagInstallment,
			config,
		};
	};

	test("should search valid taxes", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/receipts/taxes`).bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should search valid products", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/receipts/products`).bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should search valid payment methods", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.get(`/receipts/payment-methods`)
			.bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should throw BadRequestException if no daily cashier was found (type = usuario)", async ({
		assert,
		client,
	}) => {
		const { user, supplier, dailyCashier, dailyMovement, variation } =
			await createData();
		await dailyCashier.softDelete();

		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/receipts/create`)
			.json({
				supplierId: supplier.id,
				dailyMovementId: dailyMovement.id,
				receiptDate: new Date(),
				items: [
					{
						productVariationId: variation.id,
						quantity: 10,
						costValue: 10,
						unitaryValue: 20,
						discountValue: 20,
					},
				],
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw BadRequestException if no daily cashier was found (type = geral)", async ({
		assert,
		client,
	}) => {
		const { user, supplier, dailyCashier, dailyMovement, variation, config } =
			await createData();

		await config.merge({ dailyCashierType: "geral" }).save();
		await dailyCashier.softDelete();

		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/receipts/create`)
			.json({
				supplierId: supplier.id,
				dailyMovementId: dailyMovement.id,
				receiptDate: new Date(),
				items: [
					{
						productVariationId: variation.id,
						quantity: 10,
						costValue: 10,
						unitaryValue: 20,
						discountValue: 20,
					},
				],
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should create receipt", async ({ assert, client }) => {
		const { user, supplier, dailyCashier, dailyMovement, variation } =
			await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/receipts/create`)
			.json({
				supplierId: supplier.id,
				dailyMovementId: dailyMovement.id,
				dailyCashierId: dailyCashier.id,
				receiptDate: new Date(),
				items: [
					{
						productVariationId: variation.id,
						quantity: 10,
						costValue: 10,
						unitaryValue: 20,
						discountValue: 20,
					},
				],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create receipt item", async ({ assert, client }) => {
		const { user, receipt, variation, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await variation.related("businessUnitProducts").create({
			businness_unit_id: business.id,
			price: 10,
			costPrice: 10,
			stock: 10,
			maximumStock: 10,
			minimumStock: 10,
			maximumDiscountPercentage: 10,
			maximumDiscountValue: 10,
		});

		const response = await client
			.post(`/receipts/create-item`)
			.json({
				receiptId: receipt.id,
				productVariationId: variation.id,
				quantity: 10,
				costValue: 10,
				unitaryValue: 20,
				discountValue: 20,
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should delete receipt item", async ({ assert, client }) => {
		const { user, receipt } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const item = await receipt.related("items").create({
			economic_group_id: receipt.economic_group_id,
			business_unit_id: receipt.business_unit_id,
			fractionValue: new Decimal(10),
		});

		const response = await client
			.post(`/receipts/delete-item`)
			.json({
				itemId: item.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});
	//
	// test("should create receipt payment", async ({ assert, client }) => {
	// 	const { user, receipt, paymentMethod, tefAcq, tefFlag } =
	// 		await createData();
	// 	const token = await generateJwtToken(client, {
	// 		email: user.email,
	// 		password: "102030",
	// 	});
	//
	// 	const response = await client
	// 		.post(`/receipts/create-payment`)
	// 		.json({
	// 			receiptId: receipt.id,
	// 			items: [
	// 				{
	// 					paymentMethodId: paymentMethod.id,
	// 					tefAcquirerId: tefAcq.id,
	// 					tefFlagId: tefFlag.id,
	//
	// 					installments: 1,
	// 					installmentValue: 10,
	// 					issueDate: new Date(),
	// 					expirationDate: new Date(),
	//
	// 					nsuDocument: "some document",
	// 				},
	// 			],
	// 		})
	// 		.bearerToken(token);
	//
	// 	assert.equal(201, response.status());
	// });
	//
	test("should delete receipt payment", async ({ assert, client }) => {
		const { user, payment } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/receipts/delete-payment`)
			.json({
				receiptId: payment.receipt_id,
				block: payment.block,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should create supplier products", async ({ assert, client }) => {
		const { user, variation, supplier, receipt } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/receipts/create-supplier-products`)
			.json({
				receiptId: receipt.id,
				items: [
					{
						supplierId: supplier.id,
						productVariationId: variation.id,
						productSupplier: "some",
					},
				],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should finish receipt import", async ({ assert, client }) => {
		const { user, receipt } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await receipt
			.merge({ status: "PendenteXml", paidValue: 100, totalValue: 100 })
			.save();

		const response = await client
			.post(`/receipts/finish-import`)
			.json({
				receiptId: receipt.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should reopen receipt", async ({ assert, client }) => {
		const { user, receipt } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await receipt.merge({ status: "Baixada" }).save();

		const response = await client
			.post(`/receipts/reopen`)
			.json({
				receiptId: receipt.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});
});
