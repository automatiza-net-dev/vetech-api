import { test } from "@japa/runner";
import { BusinessUnitProductMetaType } from "App/Models/BusinessUnitProduct";
import Deposit, { TDepositStatus, TDepositType } from "App/Models/Deposit";
import Product, { ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import Unit, { UnitType } from "App/Models/Unit";
import Database from "@ioc:Adonis/Lucid/Database";

import { generateJwtToken, userBootstrap } from "../utils";
import { TDepositItemStatus } from "App/Models/DepositItem";
import DepositMovement from "App/Models/DepositMovement";
import { DateTime } from "luxon";

test.group("Deposit resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, group, business } = await userBootstrap();

		const deposit = await Deposit.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			description: "some description",
			type: "Venda",
			status: "Ativo",
		});

		const variationGroup = await group.related("variationGroups").create({
			description: "some description",
		});

		const unit = await Unit.create({
			name: "some name",
			tag: "some tag",
			type: UnitType.PRODUCT,
		});

		const product = await Product.create({
			description: "some product",
			type: ProductType.PRODUCT,
			referenceCode: "some reference code",
			collectionYear: 2022,
			ncm: "some ncm",
			cest: "some cest",
			features: "some features",
			unit_id: unit.id,
			active: true,
			economic_group_id: group.id,
			variation_group_id: variationGroup.id,
			icmsOrigin: "0",
		});

		const variation = await ProductVariation.create({
			product_id: product.id,
			barcode: "some barcode",
		});

		const unitProduct = await variation.related("businessUnitProducts").create({
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

		const depositItem = await deposit.related("items").create({
			business_unit_product_id: unitProduct.id,
			product_variation_id: variation.id,
			quantity: 10,
			status: "Ativo",
		});

		const depositMovement = await DepositMovement.create({
			economic_group_id: group.id,
			business_unit_id: business.id,

			responsible_user_id: user.id,
			removal_user_id: user.id,
			user_id: user.id,

			from_deposit_id: deposit.id,
			to_deposit_id: deposit.id,

			date: DateTime.now(),
			status: "Ativo",
		});

		await depositMovement.related("items").create({
			business_unit_product_id: unitProduct.id,
			product_variation_id: variation.id,
			quantity: 10,
			status: "Ativo",
		});

		return { user, deposit, variation, unitProduct, depositItem };
	};

	test("should search deposits", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.get("/deposits/search-deposits")
			.bearerToken(token);

		assert.equal(200, result.status());
		assert.isArray(result.body());
		assert.lengthOf(result.body(), 1);
	});

	test("should show deposit", async ({ assert, client }) => {
		const { user, deposit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.get(`/deposits/show-deposit/${deposit.id}`)
			.bearerToken(token);

		assert.equal(200, result.status());
	});

	test("should create deposit", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/deposits/create-deposit")
			.json({
				description: "some description",
				type: "Venda" as TDepositType,
			})
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should update deposit", async ({ assert, client }) => {
		const { user, deposit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post(`/deposits/update-deposit/${deposit.id}`)
			.json({
				description: "some description",
				type: "Venda" as TDepositType,
				status: "Inativo" as TDepositStatus,
			})
			.bearerToken(token);

		assert.equal(204, result.status());
	});

	test("should update deposit to principal", async ({ assert, client }) => {
		const { user, deposit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post(`/deposits/update-principal-deposit/${deposit.id}`)
			.bearerToken(token);

		assert.equal(204, result.status());
	});

	test("should throw BadRequestException when updating invalid type of deposit", async ({
		assert,
		client,
	}) => {
		const { user, deposit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await deposit.merge({ type: "Consumo" }).save();

		const result = await client
			.post(`/deposits/update-principal-deposit/${deposit.id}`)
			.bearerToken(token);

		assert.equal(400, result.status());
	});

	test("should create deposit item", async ({ assert, client }) => {
		const { user, unitProduct, variation, deposit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/deposits/create-deposit-item")
			.json({
				depositId: deposit.id,
				businessUnitProductId: unitProduct.id,
				productVariationId: variation.id,
				quantity: 10,
			})
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should update deposit item", async ({ assert, client }) => {
		const { user, unitProduct, depositItem } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/deposits/update-deposit-item")
			.json({
				depositItemId: depositItem.id,
				businessUnitProductId: unitProduct.id,
				quantity: 10,
				status: "Ativo" as TDepositItemStatus,
			})
			.bearerToken(token);

		assert.equal(204, result.status());
	});

	test("should search deposit movements", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.get("/deposits/search-deposit-movements")
			.bearerToken(token);

		assert.equal(200, result.status());
		assert.isArray(result.body());
		assert.lengthOf(result.body(), 1);
	});

	test("should create deposit movement", async ({ assert, client }) => {
		const { user, unitProduct, variation, deposit } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/deposits/create-deposit-movement")
			.json({
				responsibleUserId: user.id,
				removalUserId: user.id,

				fromDepositId: deposit.id,
				toDepositId: deposit.id,

				items: [
					{
						businessUnitProductId: unitProduct.id,
						productVariationId: variation.id,
						quantity: 10,
					},
				],
			})
			.bearerToken(token);

		assert.equal(201, result.status());
	});
});
