import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class CreateDepositMovementValidator {
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
		responsibleUserId: schema.string([
			rules.exists({ table: "users", column: "id" }),
		]),
		removalUserId: schema.string([
			rules.exists({ table: "users", column: "id" }),
		]),

		fromDepositId: schema.number([
			rules.exists({ table: "deposits", column: "id" }),
		]),
		toDepositId: schema.number([
			rules.exists({ table: "deposits", column: "id" }),
		]),

		items: schema.array().members(
			schema.object().members({
				businessUnitProductId: schema.string([
					rules.exists({ table: "business_unit_products", column: "id" }),
				]),
				productVariationId: schema.string([
					rules.exists({ table: "product_variations", column: "id" }),
				]),
				quantity: schema.number(),
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
