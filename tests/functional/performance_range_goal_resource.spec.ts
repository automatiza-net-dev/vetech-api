import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import Meta from "App/Models/Meta";
import PerformanceRangeGoalService from "App/Services/PerformanceRangeGoalService";
import Decimal from "decimal.js";
import { v4 } from "uuid";

import { generateJwtToken, userBootstrap } from "../utils";

type SkipAuthCtx<K extends keyof PerformanceRangeGoalService> = Parameters<
	PerformanceRangeGoalService[K]
>[1];

test.group("Performance range goals resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, group } = await userBootstrap();

		const meta = await Meta.create({
			economic_group_id: group.id,
			system_id: group.system_id,
			description: v4(),
			type: "some type",
		});

		return { user, meta, group };
	};

	test("should search PRG", async ({ assert, client }) => {
		const { user, meta, group } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await meta.related("goals").create({
			economic_group_id: group.id,
			startValue: new Decimal(100),
			endValue: new Decimal(100),
			color: "#333",
		});

		const result = await client
			.get(`/performance-range-goals/search/${meta.id}`)
			.bearerToken(token);

		assert.equal(200, result.status());
	});

	test("should create PRG", async ({ assert, client }) => {
		const { user, meta } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/performance-range-goals/store")
			.json({
				metaId: meta.id,
				ranges: [
					{
						startValue: 100,
						endValue: 200,
						color: "#000",
					},
				],
			})
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should update PRG", async ({ assert, client }) => {
		const { user, meta, group } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await meta.related("goals").create({
			economic_group_id: group.id,
			startValue: new Decimal(100),
			endValue: new Decimal(100),
			color: "#333",
		});

		const result = await client
			.put("/performance-range-goals/update")
			.json({
				metaId: meta.id,
				ranges: [
					{
						startValue: 200,
						endValue: 300,
						color: "#111",
					},
				],
			} as SkipAuthCtx<"update">)
			.bearerToken(token);

		assert.equal(200, result.status());
	});

	test("should PRG", async ({ assert, client }) => {
		const { user, meta, group } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await meta.related("goals").create({
			economic_group_id: group.id,
			startValue: new Decimal(100),
			endValue: new Decimal(100),
			color: "#333",
		});

		const result = await client
			.delete(`/performance-range-goals/delete/${meta.id}`)
			.bearerToken(token);

		assert.equal(204, result.status());
	});
});
