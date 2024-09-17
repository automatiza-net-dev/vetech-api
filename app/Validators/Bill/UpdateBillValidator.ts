import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class UpdateBillValidator {
	constructor(protected ctx: HttpContextContract) {}

	/*
	 * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
	 *
	 * For example:
	 * 1. The username must be of data type string. But then also, it should
	 *    not contain special characters or numbers.
	 *    ```
	 *     schema.string({}, [ rules.alpha() ])
	 *    ```
	 *
	 * 2. The email must be of data type string, formatted as a valid
	 *    email. But also, not used by any other user.
	 *    ```
	 *     schema.string({}, [
	 *       rules.email(),
	 *       rules.unique({ table: 'users', column: 'email' }),
	 *     ])
	 *    ```
	 */
	public schema = schema.create({
		billId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "bills", column: "id" }),
		]),
		sellerId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "users", column: "id" }),
		]),
		clientId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		patientId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		financialResponsibleId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		maxDiscount: schema.boolean.optional(),
		additionalInformation: schema.string.optional(),
		items: schema.array.optional().members(
			schema.object().members({
				billItemId: schema.string.optional(),
				productVariationId: schema.string([
					rules.uuid(),
					rules.exists({ table: "product_variations", column: "id" }),
				]),
				quantity: schema.number(),
				unitaryValue: schema.number(),
				discountValue: schema.number(),

				courtesy: schema.boolean(),
				maxDiscount: schema.boolean(),
			}),
		),
	});

	/**
	 * Custom messages for validation failures. You can make use of dot notation `(.)`
	 * for targeting nested fields and array expressions `(*)` for targeting all
	 * children of an array. For example:
	 *
	 * {
	 *   'profile.username.required': 'Username is required',
	 *   'scores.*.number': 'Define scores as valid numbers'
	 * }
	 *
	 */
	public messages: CustomMessages = {};
}
