import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import Bill, { BillStatus } from "App/Models/Bill";
import BillItem, { BillItemStatus } from "App/Models/BillItem";
import { BillPaymentFeeType } from "App/Models/BillPayment";
import { BusinessUnitProductMetaType } from "App/Models/BusinessUnitProduct";
import { DailyCashierStatus } from "App/Models/DailyCashier";
import DailyMovement, { DailyMovementStatus } from "App/Models/DailyMovement";
import Deposit from "App/Models/Deposit";
import Finance, { FinanceOriginFlag, FinanceStatus } from "App/Models/Finance";
import IssuedFiscalDocument from "App/Models/IssuedFiscalDocument";
import Kit from "App/Models/Kit";
import { PatientType } from "App/Models/Patient";
import PaymentMethod, { PaymentMethodTef } from "App/Models/PaymentMethod";
import { ProductPurpose, ProductType } from "App/Models/Product";
import ProductivityItem from "App/Models/ProductivityItem";
import ServiceIssuedFiscalDocument from "App/Models/ServiceIssuedFiscalDocument";
import TaxationGroup from "App/Models/TaxationGroup";
import TaxationGroupRule, {
	CompanyType,
	MovementCategory,
	MovementType,
} from "App/Models/TaxationGroupRule";
import TaxOperation from "App/Models/TaxOperation";
import TefAcquirer from "App/Models/TefAcquirer";
import TefFlag, { TefFlagType } from "App/Models/TefFlag";
import Unit, { UnitType } from "App/Models/Unit";
import {
	ICreateBillPaymentData,
	IUpdateBillItemData,
} from "Contracts/interfaces/IBillData";
import PatientFactory from "Database/factories/PatientFactory";
import { DateTime } from "luxon";
import { v4 } from "uuid";

import { generateJwtToken, userBootstrap } from "../utils";

test.group("Bill resource", (group) => {
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

		const client = await PatientFactory.create();
		await client.merge({ type: PatientType.TUTOR }).save();
		await client.related("tutor").create({
			email: "some",
			cellphone: "some",
			telephone: "some",
			state: "PR",
		});

		const patient = await PatientFactory.create();
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

		const bill = await Bill.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			user_id: user.id,
			seller_id: user.id,
			client_id: client.id,
			daily_movement_id: dailyMovement.id,
			daily_cashier_id: dailyCashier.id,
			status: BillStatus.A,
			tag: "2023_00001",
		});

		const payment = await bill.related("payments").create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			block: 1,
			expirationDate: DateTime.now(),
			feeType: BillPaymentFeeType.S,
			feeValue: 0,
			feePercentage: 0,
			installments: 1,
			installmentValue: 10,
			totalValue: 10, // TODO: add fee
			bill_id: bill.id,
			payment_method_id: paymentMethod.id,
			tef_flag_id: tefFlag.id,
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

		const productivity = await ProductivityItem.create({
			economic_group_id: group.id,

			description: "some description",
		});

		await productivity.related("products").create({
			economic_group_id: group.id,
			product_id: product.id,

			quantity: 10,
		});

		/*
    await bill.related('items').create({
      economic_group_id: group.id,
      business_unit_id: business.id,
      bill_id: bill.id,
      product_variation_id: variation.id,

      quantity: 10,
      costValue: 10,
      saleValue: 10,
      unitaryValue: 10,
      discountValue: 10,
      totalValue: 10,
      status: BillStatus.A,
      createdAt: DateTime.now(),
    }) */

		const kit = await Kit.create({
			description: "some description",
			fromExpiration: DateTime.now(),
			toExpiration: DateTime.now(),
			economic_group_id: business.economicGroupId,
		});

		const buProduct = await variation.related("businessUnitProducts").create({
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

		const kitItem = await kit.related("items").create({
			product_variation_id: variation.id,
			quantity: 10,
			discountPrice: 10,
			discountPercentage: 10,
			salePrice: 10,
			originalPrice: 10,
			business_unit_id: business.id,
		});

		return {
			user,
			patient,
			dailyMovement,
			dailyCashier,
			bill,
			rule,
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
			client,
			kit,
			kitItem,
			config,
			product,
			variation,
			buProduct,
		};
	};

	test("should search valid bills", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const qs = new URLSearchParams();
		qs.append("fromBill", new Date().toISOString());
		qs.append("toBill", new Date().toISOString());
		qs.append("status", BillStatus.A);
		qs.append("client", v4());
		qs.append("patient", v4());
		qs.append("patientTag", v4());
		qs.append("tag", v4());

		const response = await client
			.get(`/bills?${qs.toString()}`)
			.bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should search valid taxes", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/bills/taxes`).bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should search valid products", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/bills/products`).bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	// test('should throw BadRequestException when creating bill with no daily cashier was found', async ({
	//   assert,
	//   client,
	// }) => {
	//   const {
	//     user,
	//     client: holder,
	//     patient,
	//     dailyCashier,
	//     dailyMovement,
	//   } = await createData();
	//   const token = await generateJwtToken(client, {
	//     email: user.email,
	//     password: '102030',
	//   });
	//   await dailyCashier.softDelete();
	//
	//   const response = await client
	//     .post(`/bills/create`)
	//     .json({
	//       clientId: holder.id,
	//       patientId: patient.id,
	//       dailyMovementId: dailyMovement.id,
	//       billDate: new Date(),
	//       productValue: 100,
	//       serviceValue: 200,
	//       discountValue: 55,
	//       items: [],
	//     })
	//     .bearerToken(token);
	//
	//   assert.equal(400, response.status());
	// });
	//
	// test('should throw BadRequestException when creating bill with no daily cashier was found (type = geral)', async ({
	//   assert,
	//   client,
	// }) => {
	//   const {
	//     user,
	//     client: holder,
	//     patient,
	//     dailyCashier,
	//     dailyMovement,
	//     config,
	//   } = await createData();
	//   const token = await generateJwtToken(client, {
	//     email: user.email,
	//     password: '102030',
	//   });
	//   await config
	//     .merge({
	//       dailyCashierType: 'geral',
	//     })
	//     .save();
	//   await dailyCashier.softDelete();
	//
	//   const response = await client
	//     .post(`/bills/create`)
	//     .json({
	//       clientId: holder.id,
	//       patientId: patient.id,
	//       dailyMovementId: dailyMovement.id,
	//       billDate: new Date(),
	//       productValue: 100,
	//       serviceValue: 200,
	//       discountValue: 55,
	//       items: [],
	//     })
	//     .bearerToken(token);
	//
	//   assert.equal(400, response.status());
	// });

	test("should create bill", async ({ assert, client }) => {
		const {
			user,
			client: holder,
			patient,
			dailyCashier,
			dailyMovement,
		} = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/create`)
			.json({
				clientId: holder.id,
				patientId: patient.id,
				dailyMovementId: dailyMovement.id,
				dailyCashierId: dailyCashier.id,
				billDate: new Date(),
				productValue: 100,
				serviceValue: 200,
				discountValue: 55,
				items: [],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should update bill", async ({ assert, client }) => {
		const { user, client: holder, patient, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/update`)
			.json({
				billId: bill.id,
				sellerId: user.id,
				clientId: holder.id,
				patientId: patient.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	// test('should create multiple bills', async ({ assert, client }) => {
	//   const {
	//     user,
	//     client: holder,
	//     patient,
	//     dailyCashier,
	//     dailyMovement,
	//   } = await createData();
	//   const token = await generateJwtToken(client, {
	//     email: user.email,
	//     password: '102030',
	//   });

	//   const response = await client
	//     .post(`/bills/create-multiple`)
	//     .json({
	//       items: [
	//         {
	//           clientId: holder.id,
	//           patientId: patient.id,
	//           dailyMovementId: dailyMovement.id,
	//           dailyCashierId: dailyCashier.id,
	//           billDate: new Date(),
	//           productValue: 100,
	//           serviceValue: 200,
	//           discountValue: 55,
	//           items: [],
	//         },
	//       ],
	//     })
	//     .bearerToken(token);

	//   assert.equal(201, response.status());
	// });

	test("should create bill without open cashier", async ({
		assert,
		client,
	}) => {
		const { user, client: holder, patient } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/create`)
			.json({
				clientId: holder.id,
				patientId: patient.id,
				billDate: new Date(),
				productValue: 100,
				serviceValue: 200,
				discountValue: 55,
				items: [],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill without cashier related", async ({
		assert,
		client,
	}) => {
		const { user, client: holder, patient } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/create`)
			.json({
				clientId: holder.id,
				patientId: patient.id,
				billDate: new Date(),
				productValue: 100,
				serviceValue: 200,
				discountValue: 55,
				items: [],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should display bill", async ({ assert, client }) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.get(`/bills/show/${bill.id}`)
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	// quebra os testes de kit
	// test('should throw BadRequestException if no Taxation Rule is found', async ({
	//   assert,
	//   client,
	// }) => {
	//   const { user, bill, variation } = await createData();
	//   const token = await generateJwtToken(client, {
	//     email: user.email,
	//     password: '102030',
	//   });

	//   const response = await client
	//     .post(`/bills/create-item`)
	//     .json({
	//       billId: bill.id,
	//       productVariationId: variation.id,
	//       quantity: 10,
	//       unitaryValue: 20,
	//       discountValue: 0
	//     })
	//     .bearerToken(token);

	//   assert.equal(400, response.status());
	// });

	test("should create bill item (product)", async ({ assert, client }) => {
		const { user, bill, variation, business } = await createData();
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
			.post(`/bills/create-item`)
			.json({
				billId: bill.id,
				productVariationId: variation.id,
				quantity: 10,
				unitaryValue: 20,
				discountValue: 0,
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill items (product)", async ({ assert, client }) => {
		const { user, bill, variation, business } = await createData();
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
			.post(`/bills/create-items`)
			.json({
				items: [
					{
						billId: bill.id,
						productVariationId: variation.id,
						quantity: 10,
						unitaryValue: 20,
						discountValue: 0,
					},
				],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill item (service)", async ({ assert, client }) => {
		const { user, bill, taxation, group, unit, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const service = await group.related("products").create({
			description: "some service",
			type: ProductType.SERVICE,
			referenceCode: "some reference code",
			collectionYear: 2022,
			ncm: "some ncm",
			cest: "some cest",
			features: "some features",
			unit_id: unit.id,
			active: true,
			taxation_group_id: taxation.id,
		});

		const variation = await service.related("variations").create({
			barcode: "123",
		});
		await variation.related("variationOptions").create({
			description: "some variation option",
			active: true,
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
			.post(`/bills/create-item`)
			.json({
				billId: bill.id,
				productVariationId: variation.id,
				quantity: 10,
				unitaryValue: 20,
				discountValue: 0,
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill item (no daily cashier)", async ({
		assert,
		client,
	}) => {
		const { user, bill, variation, business, dailyCashier } =
			await createData();
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

		await dailyCashier
			.merge({
				status: DailyCashierStatus.F,
			})
			.save();

		const response = await client
			.post(`/bills/create-item`)
			.json({
				billId: bill.id,
				productVariationId: variation.id,
				quantity: 10,
				unitaryValue: 20,
				discountValue: 0,
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should throw BadRequestException if discount item if bigger than max discount", async ({
		assert,
		client,
	}) => {
		const { user, bill, variation, business, dailyCashier } =
			await createData();
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

		await dailyCashier
			.merge({
				status: DailyCashierStatus.F,
			})
			.save();

		const response = await client
			.post(`/bills/create-item`)
			.json({
				billId: bill.id,
				productVariationId: variation.id,
				quantity: 10,
				unitaryValue: 20,
				discountValue: 20,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should create bill payment", async ({ assert, client }) => {
		const { user, bill, paymentMethod, tefAcq, tefFlag, flagInstallment } =
			await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await flagInstallment.merge({ installment: 3 }).save();

		const response = await client
			.post(`/bills/create-payment`)
			.json({
				billId: bill.id,
				paymentMethodId: paymentMethod.id,
				expirationDate: new Date(),
				paymentMethodFlagInstallmentId: flagInstallment.id,
				installmentsValue: 1000,
				acquirerId: tefAcq.id,
				flagId: tefFlag.id,
				nsuDocument: "some document",
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill payment (no card)", async ({ assert, client }) => {
		const { user, bill, paymentMethod, flagInstallment } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/create-payment`)
			.json({
				billId: bill.id,
				paymentMethodId: paymentMethod.id,
				expirationDate: new Date(),
				paymentMethodFlagInstallmentId: flagInstallment.id,
				installmentsValue: 10,
				nsuDocument: "some document",
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill payment (no nsu)", async ({ assert, client }) => {
		const { user, bill, paymentMethod, flagInstallment } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/create-payment`)
			.json({
				billId: bill.id,
				paymentMethodId: paymentMethod.id,
				expirationDate: new Date(),
				paymentMethodFlagInstallmentId: flagInstallment.id,
				installmentsValue: 10,
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill payment (no flag installment)", async ({
		assert,
		client,
	}) => {
		const { user, bill, paymentMethod } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/create-payment`)
			.json({
				billId: bill.id,
				paymentMethodId: paymentMethod.id,
				expirationDate: new Date(),
				installmentsValue: 10,
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create bill payment (installments)", async ({
		assert,
		client,
	}) => {
		const { user, bill, paymentMethod } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/create-payment`)
			.json({
				billId: bill.id,
				paymentMethodId: paymentMethod.id,
				expirationDate: DateTime.now(),
				installmentsValue: 10,
				installments: 10,
			} as ICreateBillPaymentData)
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should return NotFoundException when deleting invalid bill payment ", async ({
		assert,
		client,
	}) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.delete(`/bills/delete-payment/${v4()}`)
			.bearerToken(token);

		assert.equal(404, response.status());
	});

	test("should return NotFoundException when deleting unauthorized bill payment ", async ({
		assert,
		client,
	}) => {
		const { user } = await createData();
		const { payment } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.delete(`/bills/delete-payment/${payment.id}`)
			.bearerToken(token);

		assert.equal(404, response.status());
	});

	// test('should return BadRequestException when deleting bill payment with existing finance down', async ({
	//   assert,
	//   client,
	// }) => {
	//   const { user, payment, bill } = await createData();
	//   const token = await generateJwtToken(client, {
	//     email: user.email,
	//     password: '102030',
	//   });
	//
	//   await Finance.create({
	//     originFlag: FinanceOriginFlag.S,
	//     document: bill.tag,
	//     block: payment.block,
	//     status: FinanceStatus.B,
	//   });
	//
	//   const response = await client
	//     .delete(`/bills/delete-payment/${payment.id}`)
	//     .bearerToken(token);
	//
	//   assert.equal(400, response.status());
	// });

	test("should delete bill payment", async ({ assert, client }) => {
		const { user, payment, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await payment.merge({ status: FinanceStatus.A }).save();
		await bill.merge({ paidValue: 1000 }).save();
		await Finance.create({
			originFlag: FinanceOriginFlag.S,
			origin_id: payment.id,
			document: bill.tag,
			block: payment.block,
			status: FinanceStatus.A,
			totalValue: 100,
		});

		const response = await client
			.delete(`/bills/delete-payment/${payment.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should return NotFoundException when deleting invalid bill payment block", async ({
		assert,
		client,
	}) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.delete(`/bills/delete-payment-block`)
			.json({
				block: -1,
				billId: bill.id,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	// test('should return BadRequestException when deleting bill payment with existing finance down', async ({
	//   assert,
	//   client,
	// }) => {
	//   const { user, payment, bill } = await createData();
	//   const token = await generateJwtToken(client, {
	//     email: user.email,
	//     password: '102030',
	//   });
	//
	//   await Finance.create({
	//     originFlag: FinanceOriginFlag.S,
	//     document: bill.tag,
	//     block: payment.block,
	//     status: FinanceStatus.B,
	//   });
	//
	//   const response = await client
	//     .delete(`/bills/delete-payment-block`)
	//     .json({
	//       block: payment.block,
	//       billId: bill.id,
	//     })
	//     .bearerToken(token);
	//
	//   assert.equal(400, response.status());
	// });

	test("should delete bill payment block", async ({ assert, client }) => {
		const { user, payment, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await payment.merge({ status: FinanceStatus.A }).save();
		await bill.merge({ paidValue: 1000 }).save();
		await Finance.create({
			originFlag: FinanceOriginFlag.S,
			origin_id: payment.id,
			document: bill.tag,
			block: payment.block,
			status: FinanceStatus.A,
			totalValue: 100,
		});

		const response = await client
			.delete(`/bills/delete-payment-block`)
			.json({
				block: payment.block,
				billId: bill.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should return NotFoundException if no bill was found when closing", async ({
		assert,
		client,
	}) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/bills/close-bill/${v4()}`)
			.bearerToken(token);

		assert.equal(404, response.status());
	});

	test("should return BadRequestException if bill is not open when closing", async ({
		assert,
		client,
	}) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await bill.merge({ status: BillStatus.E }).save();

		const response = await client
			.put(`/bills/close-bill/${bill.id}`)
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should return BadRequestException if bill is not fully paid when closing", async ({
		assert,
		client,
	}) => {
		const { user, dailyCashier, dailyMovement, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const bill = await Bill.create({
			economic_group_id: business.economicGroupId,
			business_unit_id: business.id,
			user_id: user.id,
			seller_id: user.id,
			daily_movement_id: dailyMovement.id,
			daily_cashier_id: dailyCashier.id,
			status: BillStatus.A,
			totalValue: 100,
		});

		const response = await client
			.put(`/bills/close-bill/${bill.id}`)
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should close bill", async ({ assert, client }) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/bills/close-bill/${bill.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should return BadRequestException if bill is not fully paid when excluding", async ({
		assert,
		client,
	}) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/bills/exclude-bill/${bill.id}`)
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should exclude bill", async ({ assert, client }) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await bill.related("payments").query().delete();

		const response = await client
			.put(`/bills/exclude-bill/${bill.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should return NotFoundException if no bill was found when reopening", async ({
		assert,
		client,
	}) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/bills/reopen-bill/${v4()}`)
			.bearerToken(token);

		assert.equal(404, response.status());
	});

	test("should return BadRequestException if bill is not closed when reopening", async ({
		assert,
		client,
	}) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/bills/reopen-bill/${bill.id}`)
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should reopen bill", async ({ assert, client }) => {
		const { user, bill } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await bill.merge({ status: BillStatus.B }).save();

		const response = await client
			.put(`/bills/reopen-bill/${bill.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should disable bill item", async ({ assert, client }) => {
		const { user, bill, business, variation, rule } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const item = await bill.related("items").create({
			economic_group_id: business.economicGroupId,
			business_unit_id: business.id,
			bill_id: bill.id,
			product_variation_id: variation.id,
			tax_rule_id: rule.id,
			quantity: 1,
			costValue: 10,
			saleValue: 10,
			unitaryValue: 10,
			discountValue: 10,
			totalValue: 100,
			status: BillItemStatus.A,
			createdAt: bill.createdAt,
			fiscalOperationCode: "0",
			icmsOriginProduct: "0",
			icmsCst: rule.icmsCst,
			icmsBase: 10,
			icmsPercentage: rule.icmsPerc,
			icmsValue: 10,
			icmsPercentageRedAliquot: rule.icmsPercRedAliquota,
			icmsPercentageRedBase: rule.icmsPercRedBaseCalculo,
			icmsStBase: 10,
			icmsStPercentageRedBase: rule.icmsPercRedAliquota,
			icmsStIva: rule.icmsPercRedAliquota,
			icmsStPercentageUfDestination: 0,
			icmsStValue: 10,
			issCst: "",
			issBase: rule.icmsPerc,
			issPercentage: rule.icmsPercRedAliquota,
			issValue: 0,
			pisBase: 0,
			pisPercentage: rule.pisPerc,
			pisValue: 0,
			pisRetentionValue: 0,
			cofinsBase: 0,
			cofinsPercentage: rule.cofinsPerc,
			cofinsValue: 0,
			cofinsRetentionValue: 0,
			ipiBase: 0,
			ipiPercentage: rule.ipiPerc,
			ipiValue: 0,
			icmsDeferredValue: 0,
			icmsPartitionValue: 0,
			icmsFcpPercentage: rule.fcpPerc,
			icmsFcpValue: 0,
			icmsPartitionOriginUfPercentage: rule.icmsPerc,
			icmsPartitionDestinationUfPercentage: rule.icmsPercRedAliquota,
			icmsPartitionInterUfPercentage: rule.icmsPercRedAliquota,
		});

		const response = await client
			.put(`/bills/disable-item/${item.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should update bill item", async ({ assert, client }) => {
		const { user, bill, business, variation, rule } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await bill
			.merge({
				productValue: 100,
				serviceValue: 100,
				discountValue: 0,
				totalValue: 200,
			})
			.save();

		const item = await bill.related("items").create({
			economic_group_id: business.economicGroupId,
			business_unit_id: business.id,
			bill_id: bill.id,
			product_variation_id: variation.id,
			tax_rule_id: rule.id,
			quantity: 1,
			costValue: 100,
			saleValue: 100,
			unitaryValue: 100,
			discountValue: 5,
			totalValue: 100,
			status: BillItemStatus.A,
			createdAt: bill.createdAt,
			fiscalOperationCode: "0",
			icmsOriginProduct: "0",
			icmsCst: rule.icmsCst,
			icmsBase: 10,
			icmsPercentage: rule.icmsPerc,
			icmsValue: 10,
			icmsPercentageRedAliquot: rule.icmsPercRedAliquota,
			icmsPercentageRedBase: rule.icmsPercRedBaseCalculo,
			icmsStBase: 10,
			icmsStPercentageRedBase: rule.icmsPercRedAliquota,
			icmsStIva: rule.icmsPercRedAliquota,
			icmsStPercentageUfDestination: 0,
			icmsStValue: 10,
			issCst: "",
			issBase: rule.icmsPerc,
			issPercentage: rule.icmsPercRedAliquota,
			issValue: 0,
			pisBase: 0,
			pisPercentage: rule.pisPerc,
			pisValue: 0,
			pisRetentionValue: 0,
			cofinsBase: 0,
			cofinsPercentage: rule.cofinsPerc,
			cofinsValue: 0,
			cofinsRetentionValue: 0,
			ipiBase: 0,
			ipiPercentage: rule.ipiPerc,
			ipiValue: 0,
			icmsDeferredValue: 0,
			icmsPartitionValue: 0,
			icmsFcpPercentage: rule.fcpPerc,
			icmsFcpValue: 0,
			icmsPartitionOriginUfPercentage: rule.icmsPerc,
			icmsPartitionDestinationUfPercentage: rule.icmsPercRedAliquota,
			icmsPartitionInterUfPercentage: rule.icmsPercRedAliquota,
		});

		const response = await client
			.put(`/bills/update-item`)
			.json({
				items: [
					{
						billItemId: item.id,
						discountValue: 10,
					},
				],
			} as IUpdateBillItemData)
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should add kit do bill", async ({ assert, client }) => {
		const { user, bill, kit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/add-kit`)
			.json({
				billId: bill.id,
				kitId: kit.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should throw BadRequestException if bill is not active", async ({
		assert,
		client,
	}) => {
		const { user, bill, kit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await bill
			.merge({
				status: BillStatus.B,
			})
			.save();

		const response = await client
			.post(`/bills/add-kit`)
			.json({
				billId: bill.id,
				kitId: kit.id,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw BadRequestException if kit is not active", async ({
		assert,
		client,
	}) => {
		const { user, bill, kit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await kit
			.merge({
				active: false,
			})
			.save();

		const response = await client
			.post(`/bills/add-kit`)
			.json({
				billId: bill.id,
				kitId: kit.id,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should fetch daily cashier conference data", async ({
		assert,
		client,
	}) => {
		const { user, dailyCashier } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.get(`/bills/conference/${dailyCashier.id}`)
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should update daily cashier conference data", async ({
		assert,
		client,
	}) => {
		const { user, dailyCashier, payment } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/bills/update-conference`)
			.json({
				dailyCashierId: dailyCashier.id,
				confirmedPayments: [payment.id],
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should create treatment from bill", async ({ assert, client }) => {
		const { user, bill, variation } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await BillItem.create({
			id: v4(),
			bill_id: bill.id,
			product_variation_id: variation.id,
			quantity: 1,
		});

		const response = await client
			.post(`/bills/create-treatment`)
			.json({
				billId: bill.id,
				sellerId: user.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should update bill financial responsible", async ({
		assert,
		client,
	}) => {
		const { user, bill, client: billClient } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/bills/financial-responsible`)
			.json({
				billId: bill.id,
				financialResponsibleId: billClient.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should throw BadRequestException if updating financial responsible from bill with fiscal document", async ({
		assert,
		client,
	}) => {
		const { user, bill, client: billClient } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await IssuedFiscalDocument.create({
			id: v4(),
			bill_id: bill.id,
		});

		const response = await client
			.put(`/bills/financial-responsible`)
			.json({
				billId: bill.id,
				financialResponsibleId: billClient.id,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw BadRequestException if updating financial responsible from bill with service fiscal document", async ({
		assert,
		client,
	}) => {
		const { user, bill, client: billClient } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await ServiceIssuedFiscalDocument.create({
			id: v4(),
			bill_id: bill.id,
		});

		const response = await client
			.put(`/bills/financial-responsible`)
			.json({
				billId: bill.id,
				financialResponsibleId: billClient.id,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw BadRequestException if neither user or unit has sale deposit", async ({
		assert,
		client,
	}) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/bills/check-deposit-availability`)
			.json({
				items: [],
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw BadRequestException deposit item has invalid qty", async ({
		assert,
		client,
	}) => {
		const { user, group, business, variation, buProduct } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const deposit = await Deposit.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			description: "some description",
			type: "Venda",
			status: "Ativo",
		});
		await user.merge({ default_sale_deposit_id: deposit.id }).save();

		await deposit.related("items").create({
			business_unit_product_id: buProduct.id,
			product_variation_id: variation.id,
			quantity: 1,
			status: "Ativo",
		});

		const response = await client
			.post(`/bills/check-deposit-availability`)
			.json({
				items: [
					{
						productVariationId: variation.id,
						quantity: 2,
					},
				],
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should return 204 if no invalid item was found", async ({
		assert,
		client,
	}) => {
		const { user, group, business, variation, buProduct } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const deposit = await Deposit.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			description: "some description",
			type: "Venda",
			status: "Ativo",
		});
		await user.merge({ default_sale_deposit_id: deposit.id }).save();

		await deposit.related("items").create({
			business_unit_product_id: buProduct.id,
			product_variation_id: variation.id,
			quantity: 3,
			status: "Ativo",
		});

		const response = await client
			.post(`/bills/check-deposit-availability`)
			.json({
				items: [
					{
						productVariationId: variation.id,
						quantity: 2,
					},
				],
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should discount deposit items", async ({ assert, client }) => {
		const { user, group, business, variation, buProduct } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const deposit = await Deposit.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			description: "some description",
			type: "Venda",
			status: "Ativo",
		});
		await user.merge({ default_sale_deposit_id: deposit.id }).save();

		const item = await deposit.related("items").create({
			business_unit_product_id: buProduct.id,
			product_variation_id: variation.id,
			quantity: 3,
			status: "Ativo",
		});

		const response = await client
			.post(`/bills/discount-deposit-items`)
			.json({
				items: [
					{
						productVariationId: variation.id,
						quantity: 2,
					},
				],
			})
			.bearerToken(token);

		await item.refresh();

		assert.equal(204, response.status());
		assert.equal(1, item.quantity);
	});

	// test('should recalculate item taxes', async ({ assert, client }) => {
	//   const { user, bill, business, variation } = await createData();
	//   const token = await generateJwtToken(client, {
	//     email: user.email,
	//     password: '102030',
	//   });

	//   await bill.related('items').create({
	//     economic_group_id: business.economicGroupId,
	//     business_unit_id: business.id,
	//     bill_id: bill.id,
	//     product_variation_id: variation.id,
	//     quantity: 1,
	//     costValue: 10,
	//     saleValue: 10,
	//     unitaryValue: 10,
	//     discountValue: 10,
	//     totalValue: 100,
	//     status: BillItemStatus.A,
	//     createdAt: bill.createdAt,
	//     fiscalOperationCode: '0',
	//     icmsOriginProduct: '0',
	//     icmsBase: 10,
	//     icmsValue: 10,
	//     icmsStBase: 10,
	//     icmsStPercentageUfDestination: 0,
	//     icmsStValue: 10,
	//     issCst: '',
	//     issValue: 0,
	//     pisBase: 0,
	//     pisValue: 0,
	//     pisRetentionValue: 0,
	//     cofinsBase: 0,
	//     cofinsValue: 0,
	//     cofinsRetentionValue: 0,
	//     ipiBase: 0,
	//     ipiValue: 0,
	//     icmsDeferredValue: 0,
	//     icmsPartitionValue: 0,
	//     icmsFcpValue: 0,
	//   });

	//   const response = await client
	//     .put(`/bills/recalculate/${bill.id}`)
	//     .bearerToken(token);

	//   assert.equal(204, response.status());
	// });
});
