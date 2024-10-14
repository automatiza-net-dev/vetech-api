import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import ClientOrigin, { ClientOriginType } from "App/Models/ClientOrigin";
import MarketingCampaign from "App/Models/MarketingCampaign";
import Opportunity from "App/Models/Opportunity";
import MarketingCampaignService from "App/Services/MarketingCampaignService";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { v4 } from "uuid";

import { generateJwtToken, userBootstrap } from "../utils";

// type T = Parameters<MarketingCampaignService['index']>[1]

test.group("Marketing Campaign resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, group, business, system } = await userBootstrap();

		const campaign = await MarketingCampaign.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			create_user_id: user.id,

			description: "SUT",
			startDate: "2024-01-01",
			endDate: "2024-12-31",
			investmentValue: new Decimal(100),
		});

		const origin = await ClientOrigin.create({
			description: "SUT",
			type: ClientOriginType.C,
			economic_group_id: group.id,
			system_id: system.id,
		});

		const opportunity = await Opportunity.create({
			system_id: system.id,
			business_unit_id: business.id,
			economic_group_id: group.id,
			opening_user_id: user.id,
			user_id: user.id,
			client_origin_id: origin.id,
			openingDate: DateTime.now(),
			contactDate: DateTime.now(),
			description: "some",
			observation: "some",
			value: 10,
		});

		return { user, group, business, campaign, origin, opportunity };
	};

	test("should get all marketing campaigns", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const qs = new URLSearchParams();
		qs.append("clientOriginId", v4());
		qs.append("active", "true");

		const result = await client
			.get(`/marketing-campaigns?${qs.toString()}`)
			.bearerToken(token);

		assert.equal(200, result.status());
		assert.isArray(result.body());
	});

	test("should search marketing campaigns", async ({ assert, client }) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const qs = new URLSearchParams();
		qs.append("id", "1");
		qs.append("description", v4());
		qs.append("active", "true");

		const result = await client
			.get(`/marketing-campaigns/search?${qs.toString()}`)
			.bearerToken(token);

		assert.equal(200, result.status());
		assert.isArray(result.body());
	});

	test("should create marketing campaign without origins", async ({
		assert,
		client,
	}) => {
		const { user } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/marketing-campaigns/store")
			.json({
				clientOriginIdList: [],
				description: "SUT",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
				investmentValue: 100,
			} as Omit<
				Parameters<MarketingCampaignService["store"]>[1],
				"startDate" | "endDate"
			>)
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should create marketing campaign with origins", async ({
		assert,
		client,
	}) => {
		const { user, origin } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/marketing-campaigns/store")
			.json({
				clientOriginIdList: [origin.id],
				description: "SUT",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
				investmentValue: 100,
			} as Omit<
				Parameters<MarketingCampaignService["store"]>[1],
				"startDate" | "endDate"
			>)
			.bearerToken(token);

		assert.equal(201, result.status());
	});

	test("should update marketing campaign without origins", async ({
		assert,
		client,
	}) => {
		const { user, campaign } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		assert.lengthOf(await campaign.related("clientOrigins").query(), 0);

		const result = await client
			.put("/marketing-campaigns/update")
			.json({
				id: campaign.id,
				clientOriginIdList: [],
				description: "SUT",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
				investmentValue: 100,
				active: true,
			} as Omit<
				Parameters<MarketingCampaignService["update"]>[1],
				"startDate" | "endDate"
			>)
			.bearerToken(token);

		assert.lengthOf(await campaign.related("clientOrigins").query(), 0);
		assert.equal(200, result.status());
	});

	test("should update marketing campaign adding origins", async ({
		assert,
		client,
	}) => {
		const { user, campaign, origin } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		assert.lengthOf(await campaign.related("clientOrigins").query(), 0);

		const result = await client
			.put("/marketing-campaigns/update")
			.json({
				id: campaign.id,
				clientOriginIdList: [origin.id],
				description: "SUT",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
				investmentValue: 100,
				active: true,
			} as Omit<
				Parameters<MarketingCampaignService["update"]>[1],
				"startDate" | "endDate"
			>)
			.bearerToken(token);

		assert.lengthOf(await campaign.related("clientOrigins").query(), 1);
		assert.equal(200, result.status());
	});

	test("should update marketing campaign removing origins", async ({
		assert,
		client,
	}) => {
		const { user, campaign, origin } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await campaign.related("clientOrigins").create({
			client_origin_id: origin.id,
			business_unit_id: campaign.business_unit_id,
			economic_group_id: campaign.economic_group_id,
		});

		assert.lengthOf(await campaign.related("clientOrigins").query(), 1);

		const result = await client
			.put("/marketing-campaigns/update")
			.json({
				id: campaign.id,
				clientOriginIdList: [],
				description: "SUT",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
				investmentValue: 100,
				active: true,
			} as Omit<
				Parameters<MarketingCampaignService["update"]>[1],
				"startDate" | "endDate"
			>)
			.bearerToken(token);

		assert.lengthOf(await campaign.related("clientOrigins").query(), 0);
		assert.equal(200, result.status());
	});

	test("should destroy marketing campaign", async ({ assert, client }) => {
		const { user, campaign } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.delete(`/marketing-campaigns/delete/${campaign.id}`)
			.bearerToken(token);

		assert.equal(204, result.status());
	});

	test("should update marketing campaign swapping origins", async ({
		assert,
		client,
	}) => {
		const { user, campaign, origin } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const origin2 = await ClientOrigin.create({
			description: "SUT",
			type: ClientOriginType.C,
			economic_group_id: origin.economic_group_id,
			system_id: origin.system_id,
		});

		await campaign.related("clientOrigins").create({
			client_origin_id: origin.id,
			business_unit_id: campaign.business_unit_id,
			economic_group_id: campaign.economic_group_id,
		});

		assert.lengthOf(await campaign.related("clientOrigins").query(), 1);

		const result = await client
			.put("/marketing-campaigns/update")
			.json({
				id: campaign.id,
				clientOriginIdList: [origin2.id],
				description: "SUT",
				startDate: "2024-01-01",
				endDate: "2024-12-31",
				investmentValue: 100,
				active: true,
			} as Omit<
				Parameters<MarketingCampaignService["update"]>[1],
				"startDate" | "endDate"
			>)
			.bearerToken(token);

		assert.lengthOf(await campaign.related("clientOrigins").query(), 1);
		assert.equal(200, result.status());
	});

	test("should not destroy marketing campaign if opportunity is associated", async ({
		assert,
		client,
	}) => {
		const { user, campaign, opportunity } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		await opportunity.merge({ marketing_campaign_id: campaign.id }).save();

		const result = await client
			.delete(`/marketing-campaigns/delete/${campaign.id}`)
			.bearerToken(token);

		assert.equal(400, result.status());
	});
});
