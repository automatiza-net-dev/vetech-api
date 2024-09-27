import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import AccountPlan from "App/Models/AccountPlan";
import AccountPlanGroup, {
	AccountPlanGroupType,
} from "App/Models/AccountPlanGroup";
import DreCostPlanning from "App/Models/DreCostPlanning";
import DreGroup from "App/Models/DreGroup";
import DreGroupService from "App/Services/DreGroupService";

import { generateJwtToken, userBootstrap } from "../utils";

// type T = Parameters<MarketingCampaignService['index']>[1]

test.group("Dre Groups resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, group, business, system } = await userBootstrap();

		const apg = await AccountPlanGroup.create({
			economic_group_id: group.id,
			system_id: system.id,

			description: "SUT",
			type: AccountPlanGroupType.A,
		});

		const accountPlan = await AccountPlan.create({
			account_plan_group_id: apg.id,
			system_id: system.id,
			business_unit_id: business.id,

			description: "SUT",
			code: "SUT",
		});

		return { user, group, business, system, accountPlan };
	};

	test("should search dre groups", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const qs = new URLSearchParams();
		qs.append("dreGroup", "1");
		qs.append("description", "SUT");
		qs.append("active", "true");

		const result = await client
			.get(`/dre-groups/search?${qs.toString()}`)
			.bearerToken(token);

		assert.equal(200, result.status());
		assert.isArray(result.body());
	});

	test("should create dre groups", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/dre-groups/store")
			.json({
				description: "SUT",
				sequence: Math.floor(Math.random() * 100),
			} as Parameters<DreGroupService["store"]>[1])
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should not create dre groups with duplicate sequence", async ({
		assert,
		client,
	}) => {
		const { user, system, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await DreGroup.create({
			system_id: system.id,
			economic_group_id: business.economicGroupId,
			create_user_id: user.id,

			description: "SUT",
			sequence: 1,
			active: true,
		});

		const result = await client
			.post("/dre-groups/store")
			.json({
				description: "SUT",
				sequence: 1,
			} as Parameters<DreGroupService["store"]>[1])
			.bearerToken(token);

		assert.equal(400, result.status());
	});

	test("should update dre group", async ({ assert, client }) => {
		const { user, system, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const group = await DreGroup.create({
			system_id: system.id,
			economic_group_id: business.economicGroupId,
			create_user_id: user.id,

			description: "SUT",
			sequence: 1,
			active: true,
		});

		const result = await client
			.put("/dre-groups/update")
			.json({
				id: group.id,
				description: "SUT 2",
				sequence: 1,
				active: true,
			} as Parameters<DreGroupService["update"]>[1])
			.bearerToken(token);

		assert.equal(200, result.status());
	});

	test("should not update dre group for duplicate sequence", async ({
		assert,
		client,
	}) => {
		const { user, system, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const group1 = await DreGroup.create({
			system_id: system.id,
			economic_group_id: business.economicGroupId,
			create_user_id: user.id,

			description: "SUT",
			sequence: 1,
			active: true,
		});

		await DreGroup.create({
			system_id: system.id,
			economic_group_id: business.economicGroupId,
			create_user_id: user.id,

			description: "SUT",
			sequence: 2,
			active: true,
		});

		const result = await client
			.put("/dre-groups/update")
			.json({
				id: group1.id,
				description: "SUT 2",
				sequence: 2,
				active: true,
			} as Parameters<DreGroupService["update"]>[1])
			.bearerToken(token);

		assert.equal(400, result.status());
	});

	test("should delete dre groups", async ({ assert, client }) => {
		const { user, system, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const group = await DreGroup.create({
			system_id: system.id,
			economic_group_id: business.economicGroupId,
			create_user_id: user.id,

			description: "SUT",
			sequence: Math.floor(Math.random() * 1000000),
			active: true,
		});

		const result = await client
			.delete(`/dre-groups/delete/${group.id}`)
			.bearerToken(token);

		assert.equal(204, result.status());
	});

	test("should create dre group planning", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/dre-groups/store-planning")
			.json({
				period: "2024-09",
				accountPlans: [],
			} as Parameters<DreGroupService["storePlanning"]>[1])
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should create dre group planning with items ", async ({
		assert,
		client,
	}) => {
		const { user, accountPlan } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/dre-groups/store-planning")
			.json({
				period: "2024-09",
				accountPlans: [
					{
						accountPlanId: accountPlan.id,
						cost: 100,
					},
				],
			} as Parameters<DreGroupService["storePlanning"]>[1])
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should create dre group planning with duplicate items ", async ({
		assert,
		client,
	}) => {
		const { user, accountPlan } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/dre-groups/store-planning")
			.json({
				period: "2024-09",
				accountPlans: [
					{
						accountPlanId: accountPlan.id,
						cost: 100,
					},
					{
						accountPlanId: accountPlan.id,
						cost: 100,
					},
				],
			} as Parameters<DreGroupService["storePlanning"]>[1])
			.bearerToken(token);

		assert.equal(400, result.status());
	});

	test("should update dre group planning", async ({ assert, client }) => {
		const { user, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const planning = await DreCostPlanning.create({
			business_unit_id: business.id,
			create_user_id: user.id,
			period: "2024-09",
		});

		const result = await client
			.put("/dre-groups/update-planning")
			.json({
				dreGroupPlanningId: planning.id,
				accountPlans: [],
			} as Parameters<DreGroupService["updatePlanning"]>[1])
			.bearerToken(token);

		assert.equal(200, result.status());
	});

	test("should update dre group planning with items ", async ({
		assert,
		client,
	}) => {
		const { user, business, accountPlan } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const planning = await DreCostPlanning.create({
			business_unit_id: business.id,
			create_user_id: user.id,
			period: "2024-09",
		});

		const result = await client
			.put("/dre-groups/update-planning")
			.json({
				dreGroupPlanningId: planning.id,
				accountPlans: [
					{
						accountPlanId: accountPlan.id,
						cost: 100,
					},
				],
			} as Parameters<DreGroupService["updatePlanning"]>[1])
			.bearerToken(token);

		assert.equal(200, result.status());
	});

	test("should update dre group planning with duplicate items ", async ({
		assert,
		client,
	}) => {
		const { user, accountPlan, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const planning = await DreCostPlanning.create({
			business_unit_id: business.id,
			create_user_id: user.id,
			period: "2024-09",
		});

		const result = await client
			.put("/dre-groups/update-planning")
			.json({
				dreGroupPlanningId: planning.id,
				accountPlans: [
					{
						accountPlanId: accountPlan.id,
						cost: 100,
					},
					{
						accountPlanId: accountPlan.id,
						cost: 100,
					},
				],
			} as Parameters<DreGroupService["updatePlanning"]>[1])
			.bearerToken(token);

		assert.equal(400, result.status());
	});

	test("should delete dre group planning", async ({ assert, client }) => {
		const { user, business } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const planning = await DreCostPlanning.create({
			business_unit_id: business.id,
			create_user_id: user.id,
			period: "2024-09",
		});

		const result = await client
			.delete(`/dre-groups/delete-planning/${planning.id}`)
			.bearerToken(token);

		assert.equal(204, result.status());
	});
});
