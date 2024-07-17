import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateBudgetItemValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		budgetId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "budgets", column: "id" }),
		]),
		productVariationId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "product_variations", column: "id" }),
		]),
		quantity: schema.number(),
		saleValue: schema.number(),
		unitaryValue: schema.number(),
		discountValue: schema.number(),
		courtesy: schema.boolean.optional(),
	});

	public messages: CustomMessages = {};
}
