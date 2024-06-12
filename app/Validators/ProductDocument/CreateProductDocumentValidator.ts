import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { ProductDocumentType } from "App/Models/ProductDocument";

export default class CreateProductDocumentValidator {
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
		systemProductId: schema.number([
			rules.exists({ table: "system_products", column: "id" }),
		]),
		economicGroupId: schema.string([
			rules.exists({ table: "economic_groups", column: "id" }),
		]),
		businessUnitId: schema.string([
			rules.exists({ table: "business_units", column: "id" }),
		]),
		productId: schema.string.optional([
			rules.exists({ table: "products", column: "id" }),
		]),
		documentTemplateId: schema.string([
			rules.exists({ table: "document_templates", column: "id" }),
		]),
		type: schema.enum(ProductDocumentType),
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
