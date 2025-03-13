import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";

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
