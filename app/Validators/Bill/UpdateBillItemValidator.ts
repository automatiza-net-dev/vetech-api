import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateBillItemValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		items: schema.array().members(
			schema.object().members({
				billItemId: schema.string({ trim: true }, [
					rules.uuid(),
					rules.exists({ table: "bill_items", column: "id" }),
				]),
				unitaryValue: schema.number(),
				discountValue: schema.number(),
				courtesy: schema.boolean(),
				shouldValidateDiscount: schema.boolean(),
				maxDiscount: schema.boolean.optional(),

				departmentId: schema.number.optional([
					rules.exists({ table: "departments", column: "id" }),
				]),
				departmentItemId: schema.number.optional([
					rules.exists({ table: "department_items", column: "id" }),
				]),
				observation: schema.string.optional(),
			}),
		),
	});

	public messages: CustomMessages = {};
}
