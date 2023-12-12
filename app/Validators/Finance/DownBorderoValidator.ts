import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class DownBorderoValidator {
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
		id: schema.string([
			rules.uuid(),
			rules.exists({
				table: "borderos",
				column: "id",
			}),
		]),
		checkingAccountId: schema.string([
			rules.uuid(),
			rules.exists({ table: "checking_accounts", column: "id" }),
		]),
		paymentMethodId: schema.string.optional([
			rules.uuid(),
			rules.exists({ table: "payment_methods", column: "id" }),
		]),

		paymentDate: schema.date(),
		interestValue: schema.number(),
		interestPercentage: schema.number(),
		discountValue: schema.number(),
		discountPercentage: schema.number(),
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
