import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class ConfirmBudgetValidator {
	constructor(protected ctx: HttpContextContract) {}

	type = this.ctx.request.input("type");

	reasonRules = [
		rules.uuid(),
		rules.exists({ table: "reasons", column: "id" }),
	];

	public schema = schema.create({
		clientId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),

		type: schema.enum(["PARCIAL", "TOTAL"] as const),
		notConfirmedItems: schema
			.array()
			.members(
				schema.string({}, [
					rules.uuid(),
					rules.exists({ table: "budget_items", column: "id" }),
				]),
			),
		finishedAt: schema.date(),
		observation: schema.string.optional({}, []),
		reasonId:
			this.type === "PARCIAL"
				? schema.string({}, this.reasonRules)
				: schema.string.optional({}, this.reasonRules),
		canceledObservation:
			this.type === "PARCIAL"
				? schema.string({}, [])
				: schema.string.optional({}, []),
		internalObservation: schema.string.optional({}, []),
	});

	public messages: CustomMessages = {};
}
