import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class DeleteBudgetItemDepartmentValidator {
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
		items: schema.array().members(
			schema.object().members({
				budgetId: schema.string([
					rules.exists({ table: "budgets", column: "id" }),
				]),
				budgetItemId: schema.string([
					rules.exists({ table: "budget_items", column: "id" }),
				]),
				budgetItemDepartmentId: schema.number([
					rules.exists({ table: "budget_item_departments", column: "id" }),
				]),
				departmentId: schema.number([
					rules.exists({ table: "departments", column: "id" }),
				]),
				departmentItemId: schema.number([
					rules.exists({ table: "department_items", column: "id" }),
				]),
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
