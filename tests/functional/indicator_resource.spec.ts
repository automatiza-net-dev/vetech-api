import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import { BusinessUnitProductMetaType } from "App/Models/BusinessUnitProduct";
import Deposit, { TDepositStatus, TDepositType } from "App/Models/Deposit";
import { TDepositItemStatus } from "App/Models/DepositItem";
import DepositMovement from "App/Models/DepositMovement";
import Product, { ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import Unit, { UnitType } from "App/Models/Unit";
import Decimal from "decimal.js";
import { DateTime } from "luxon";

import { generateJwtToken, userBootstrap } from "../utils";

test.group("Indicator resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user } = await userBootstrap();

		return { user };
	};

	test("should search deposits", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client.get("/dashboard").bearerToken(token);

		console.log(result.body());
		assert.equal(200, result.status());
	});
});
