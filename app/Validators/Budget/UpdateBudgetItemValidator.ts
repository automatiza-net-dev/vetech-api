import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";
import { BudgetStatus } from "App/Models/Budget";

export default class UpdateBudgetItemValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		quantity: schema.number(),
		unitaryValue: schema.number(),
		discountValue: schema.number(),
		courtesy: schema.boolean(),
		status: schema.enum(Object.values(BudgetStatus)),
	});

	public messages: CustomMessages = {};
}
