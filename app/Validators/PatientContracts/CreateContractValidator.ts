import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class CreateContractValidator {
	constructor(protected ctx: HttpContextContract) {}

	/*
	 * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
	 *
	 * For example:
	 * 1. The username must be of data type string. But then also, it should
	 *    not contain special characters or numbers.
	 *    ```
	 *     schema.string([ rules.alpha() ])
	 *    ```
	 *
	 * 2. The email must be of data type string, formatted as a valid
	 *    email. But also, not used by any other user.
	 *    ```
	 *     schema.string([
	 *       rules.email(),
	 *       rules.unique({ table: 'users', column: 'email' }),
	 *     ])
	 *    ```
	 */
	public schema = schema.create({
		patientId: schema.string([
			rules.exists({ table: "patients", column: "id" }),
		]),
		productId: schema.string([
			rules.exists({ table: "products", column: "id" }),
		]),
		productVariationId: schema.string([
			rules.exists({ table: "product_variations", column: "id" }),
		]),
		businessUnitProductId: schema.string([
			rules.exists({ table: "business_unit_products", column: "id" }),
		]),
		paymentMethodId: schema.string([
			rules.exists({ table: "payment_methods", column: "id" }),
		]),

		quantity: schema.number(),
		unitaryValue: schema.number(),
		promotionalValue: schema.number(),
		promotionalValueExpiration: schema.string({}, [
			rules.regex(/^\d{2}\/\d{4}$/),
		]),
		expirationDay: schema.number(),
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
