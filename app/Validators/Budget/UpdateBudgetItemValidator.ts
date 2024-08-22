import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema, rules } from "@ioc:Adonis/Core/Validator";
import { BudgetStatus } from "App/Models/Budget";

export default class UpdateBudgetItemValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		items: schema.array().members(
			schema.object().members({
				budgetItemId: schema.string([
					rules.exists({ table: "budget_items", column: "id" }),
				]),
				quantity: schema.number(),
				unitaryValue: schema.number(),
				discountValue: schema.number(),
				status: schema.enum(Object.values(BudgetStatus)),
				courtesy: schema.boolean.optional(),
				maxDiscount: schema.boolean.optional(),
			}),
		),
	});

	public messages: CustomMessages = {};
}
