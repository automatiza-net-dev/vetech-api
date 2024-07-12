import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateBillItemsValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		items: schema.array().members(
			schema.object().members({
				billId: schema.string({ trim: true }, [
					rules.uuid(),
					rules.exists({ table: "bills", column: "id" }),
				]),
				productVariationId: schema.string({ trim: true }, [
					rules.uuid(),
					rules.exists({ table: "product_variations", column: "id" }),
				]),
				quantity: schema.number(),
				unitaryValue: schema.number(),
				discountValue: schema.number(),
				courtesy: schema.boolean.optional([]),
			}),
		),
	});

	public messages: CustomMessages = {};
}
