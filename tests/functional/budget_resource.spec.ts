import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import Attendance from "App/Models/Attendance";
import Budget, { BudgetStatus } from "App/Models/Budget";
import BudgetPayment, {
	TBudgetPaymentExclusionOrigin,
} from "App/Models/BudgetPayment";
import { BusinessUnitProductMetaType } from "App/Models/BusinessUnitProduct";
import DailyCashier from "App/Models/DailyCashier";
import DailyMovement from "App/Models/DailyMovement";
import Kit from "App/Models/Kit";
import PaymentMethod, {
	PaymentMethodTef,
	PaymentMethodType,
} from "App/Models/PaymentMethod";
import { ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import Reason from "App/Models/Reason";
import TefAcquirer from "App/Models/TefAcquirer";
import TefFlag, { TefFlagType } from "App/Models/TefFlag";
import Unit, { UnitType } from "App/Models/Unit";
import PatientFactory from "Database/factories/PatientFactory";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { v4 } from "uuid";

import { generateJwtToken, userBootstrap } from "../utils";

test.group("Budget resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, business, group } = await userBootstrap();

		const client = await PatientFactory.create();
		const patient = await PatientFactory.create();
		const dailyMovement = await DailyMovement.create({
			business_unit_id: business.id,
		});
		const dailyCashier = await DailyCashier.create({
			business_unit_id: business.id,
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
			active: true,
			icmsOrigin: "0",
		});

		const variation = await ProductVariation.create({
			barcode: "123",
			product_id: product.id,
		});
		await variation.related("variationOptions").create({
			description: "some variation option",
			active: true,
		});

		const budget = await Budget.create({
			business_unit_id: business.id,
			status: BudgetStatus.A,
			client_id: client.id,
		});

		const budgetItem = await budget.related("items").create({
			business_unit_id: business.id,
			quantity: new Decimal(12),
			saleValue: new Decimal(10),
			unitaryValue: 10,
			discountValue: 2,
			product_variation_id: variation.id,
		});

		const reason = await Reason.create({
			economicGroupId: group.id,
			type: "OR",
			reason: "Test",
		});

		const kit = await Kit.create({
			description: "some description",
			fromExpiration: DateTime.now(),
			toExpiration: DateTime.now(),
			economic_group_id: business.economicGroupId,
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

		const kitItem = await kit.related("items").create({
			product_variation_id: variation.id,
			quantity: 10,
			discountPrice: 10,
			discountPercentage: 10,
			salePrice: 10,
			originalPrice: 10,
			business_unit_id: business.id,
		});

		const attendance = await Attendance.create({
			business_unit_id: business.id,
			patient_id: patient.id,
			tutor_id: client.id,
			startDate: DateTime.now().minus({ hour: 1 }),
		});

		const paymentMethod = await PaymentMethod.create({
			economicGroupId: group.id,
			description: "some description",
			requiresDocument: true,
			tef: PaymentMethodTef.N,
			automaticCancellation: true,
			daysFirstInstallment: 10,
			daysBetweenInstallments: 10,
			allowChangeExpirationDate: false,
			minimumInstallmentValue: 10,
			type: PaymentMethodType.C,
			fee: 0,
			daysUntilTransfer: 0,
			installmentsWithoutPassword: 1,
			maxInstallments: 10,
		});

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

		const budgetPayment = await BudgetPayment.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			budget_id: budget.id,
			payment_method_id: paymentMethod.id,
			tef_acquirer_id: tefAcq.id,
			tef_flag_id: tefFlag.id,
			user_id: user.id,

			status: "Aberto",
			totalValue: 0,
		});

		return {
			user,
			client,
			patient,
			dailyMovement,
			dailyCashier,
			budget,
			budgetItem,
			reason,
			variation,
			kit,
			kitItem,
			attendance,
			paymentMethod,
			tefAcq,
			tefFlag,
			budgetPayment,
		};
	};

	test("should return all budgets (partial)", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/budgets/partial`).bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should return all budgets (complete)", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/budgets/complete`).bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should throw ResourceNoFoundException if no budget was found", async ({
		assert,
		client,
	}) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/budgets/${v4()}`).bearerToken(token);

		assert.equal(404, response.status());
	});

	test("should return complete budget", async ({ assert, client }) => {
		const { user, budget } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.get(`/budgets/${budget.id}`)
			.bearerToken(token);

		assert.equal(200, response.status());
		assert.equal(budget.id, response.body().id);
	});

	test("should return all products", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client.get(`/budgets/products`).bearerToken(token);

		assert.equal(200, response.status());
		assert.isArray(response.body());
	});

	test("should create budget", async ({ assert, client }) => {
		const {
			user,
			client: dbClient,
			dailyCashier,
			dailyMovement,
			patient,
			attendance,
		} = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/budgets/create`)
			.json({
				sellerId: user.id,
				reviewerId: user.id,
				clientId: dbClient.id,
				patientId: patient.id,
				dailyMovementId: dailyMovement.id,
				dailyCashierId: dailyCashier.id,
				attendanceId: attendance.id,

				budgetDate: new Date(),
				expirationDate: new Date(),
				observation: "some",
				items: [],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create budget without cashier related", async ({
		assert,
		client,
	}) => {
		const { user, client: dbClient, patient } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/budgets/create`)
			.json({
				sellerId: user.id,
				reviewerId: user.id,
				clientId: dbClient.id,
				patientId: patient.id,
				budgetDate: new Date(),
				expirationDate: new Date(),
				observation: "some",
				items: [],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should create budget item", async ({ assert, client }) => {
		const { user, budget, variation } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/budgets/create-item`)
			.json({
				budgetId: budget.id,
				productVariationId: variation.id,
				quantity: 5,
				saleValue: 10,
				unitaryValue: 10,
				discountValue: 2,
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should throw BadRequestException if discount item if bigger than max discount", async ({
		assert,
		client,
	}) => {
		const { user, budget, variation } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/budgets/create-item`)
			.json({
				budgetId: budget.id,
				productVariationId: variation.id,
				quantity: 5,
				saleValue: 10,
				unitaryValue: 10,
				discountValue: 10000,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should create budget items", async ({ assert, client }) => {
		const { user, budget, variation } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/budgets/create-items`)
			.json({
				items: [
					{
						budgetId: budget.id,
						productVariationId: variation.id,
						quantity: 5,
						saleValue: 10,
						unitaryValue: 10,
						discountValue: 2,
					},
				],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should throw BadRequestException if some discount item if bigger than max discount", async ({
		assert,
		client,
	}) => {
		const { user, budget, variation } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/budgets/create-items`)
			.json({
				items: [
					{
						budgetId: budget.id,
						productVariationId: variation.id,
						quantity: 5,
						saleValue: 10,
						unitaryValue: 10,
						discountValue: 10000,
					},
				],
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should update budget", async ({ assert, client }) => {
		const { user, budget } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/budgets/update/${budget.id}`)
			.json({
				sellerId: user.id,
				clientId: budget.client_id,
				patientId: budget.patient_id,
				reviewerId: user.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should update budget observation", async ({ assert, client }) => {
		const { user, budget } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/budgets/update-observation/${budget.id}`)
			.json({
				observation: "some observation",
				internalObservation: "some observation",
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should update budget item", async ({ assert, client }) => {
		const { user, budgetItem } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/budgets/update-item/${budgetItem.id}`)
			.json({
				quantity: 200,
				unitaryValue: 200,
				saleValue: 10,
				discountValue: 0,
				status: BudgetStatus.C,
			})
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should confirm budget (TOTAL)", async ({ assert, client }) => {
		const { user, budget } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/budgets/confirm/${budget.id}`)
			.json({
				type: "TOTAL",
				notConfirmedItems: [],
				finishedAt: new Date(),
			})
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should confirm budget (PARCIAL)", async ({ assert, client }) => {
		const { user, budget, reason } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/budgets/confirm/${budget.id}`)
			.json({
				type: "PARCIAL",
				notConfirmedItems: [],
				finishedAt: new Date(),
				reasonId: reason.id,
				canceledObservation: "Test",
			})
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should cancel budget", async ({ assert, client }) => {
		const { user, budget, reason } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.put(`/budgets/cancel/${budget.id}`)
			.json({
				reasonId: reason.id,
				finishedAt: new Date(),
				canceledObservation: "some observation",
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should add kit do budget", async ({ assert, client }) => {
		const { user, budget, kit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.post(`/budgets/add-kit`)
			.json({
				budgetId: budget.id,
				kitId: kit.id,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should throw BadRequestException if budget is not active", async ({
		assert,
		client,
	}) => {
		const { user, budget, kit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await budget
			.merge({
				status: BudgetStatus.C,
			})
			.save();

		const response = await client
			.post(`/budgets/add-kit`)
			.json({
				budgetId: budget.id,
				kitId: kit.id,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw BadRequestException if kit is not active", async ({
		assert,
		client,
	}) => {
		const { user, budget, kit } = await createData();
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
			.post(`/budgets/add-kit`)
			.json({
				budgetId: budget.id,
				kitId: kit.id,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw BadRequestException if budget has invalid status when deleting", async ({
		assert,
		client,
	}) => {
		const { user, budget } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await budget
			.merge({
				status: BudgetStatus.C,
			})
			.save();

		const response = await client
			.delete(`/budgets/delete/${budget.id}`)
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should soft delete budget", async ({ assert, client }) => {
		const { user, budget } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const response = await client
			.delete(`/budgets/delete/${budget.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should create budget payments", async ({ assert, client }) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budget.merge({ paidValue: 0, totalValue: 1000 }).save();

		const response = await client
			.post("/budgets/create-payments")
			.json({
				budgetId: dataProps.budget.id,
				items: [
					{
						paymentMethodId: dataProps.paymentMethod.id,
						tefFlagId: dataProps.tefFlag.id,
						tefAcquirerId: dataProps.tefAcq.id,

						totalValue: 100,
						installments: 1,
					},
					{
						paymentMethodId: dataProps.paymentMethod.id,
						tefFlagId: dataProps.tefFlag.id,
						tefAcquirerId: dataProps.tefAcq.id,

						totalValue: 150,
						installments: 2,
					},
				],
			})
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should throw error if new value is bigger than total value", async ({
		assert,
		client,
	}) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budget.merge({ paidValue: 0, totalValue: 99 }).save();

		const response = await client
			.post("/budgets/create-payments")
			.json({
				budgetId: dataProps.budget.id,
				items: [
					{
						paymentMethodId: dataProps.paymentMethod.id,
						tefFlagId: dataProps.tefFlag.id,
						tefAcquirerId: dataProps.tefAcq.id,

						totalValue: 100,
						installments: 1,
					},
				],
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should update budget payment", async ({ assert, client }) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budget.merge({ paidValue: 0, totalValue: 100 }).save();

		const response = await client
			.put("/budgets/update-payment")
			.json({
				budgetPaymentId: dataProps.budgetPayment.id,
				paymentMethodId: dataProps.paymentMethod.id,
				tefFlagId: dataProps.tefFlag.id,
				tefAcquirerId: dataProps.tefAcq.id,

				totalValue: 50,
				installments: 1,
				updateDate: new Date().toISOString(),
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should throw error if updated value is bigger than total value", async ({
		assert,
		client,
	}) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budget.merge({ paidValue: 0, totalValue: 100 }).save();

		const response = await client
			.put("/budgets/update-payment")
			.json({
				budgetPaymentId: dataProps.budgetPayment.id,
				paymentMethodId: dataProps.paymentMethod.id,
				tefFlagId: dataProps.tefFlag.id,
				tefAcquirerId: dataProps.tefAcq.id,

				totalValue: 101,
				installments: 1,
				updateDate: new Date().toISOString(),
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should exclude budget payment", async ({ assert, client }) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budget.merge({ status: BudgetStatus.C }).save();

		const response = await client
			.put("/budgets/exclude-payment")
			.json({
				budgetPaymentId: dataProps.budgetPayment.id,
				origin: "Venda" as TBudgetPaymentExclusionOrigin,
			})
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should throw error if budget payment isnt 'Aberto'", async ({
		assert,
		client,
	}) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budgetPayment.merge({ status: "Excluido" }).save();
		// await dataProps.budget.merge({ status: BudgetStatus.C }).save();

		const response = await client
			.put("/budgets/exclude-payment")
			.json({
				budgetPaymentId: dataProps.budgetPayment.id,
				origin: "Venda" as TBudgetPaymentExclusionOrigin,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw error if 'Venda' exclude has invalid budget status", async ({
		assert,
		client,
	}) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		// await dataProps.budget.merge({ status: BudgetStatus.C }).save();

		const response = await client
			.put("/budgets/exclude-payment")
			.json({
				budgetPaymentId: dataProps.budgetPayment.id,
				origin: "Venda" as TBudgetPaymentExclusionOrigin,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should throw error if 'Orçamento' exclude has invalid budget status", async ({
		assert,
		client,
	}) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budget.merge({ status: BudgetStatus.N }).save();

		const response = await client
			.put("/budgets/exclude-payment")
			.json({
				budgetPaymentId: dataProps.budgetPayment.id,
				origin: "Orçamento" as TBudgetPaymentExclusionOrigin,
			})
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should list budget payments", async ({ assert, client }) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		const response = await client
			.get(`/budgets/payments/${dataProps.budget.id}`)
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should delete budget item", async ({ assert, client }) => {
		const dataProps = await createData();
		const token = await generateJwtToken(client, {
			email: dataProps.user.email,
			password: "102030",
		});

		await dataProps.budgetItem.merge({ status: BudgetStatus.A }).save();

		const response = await client
			.delete(`/budgets/delete-item/${dataProps.budgetItem.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});
});
