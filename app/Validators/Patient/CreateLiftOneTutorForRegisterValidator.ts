import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { PatientGender } from "App/Models/Patient";

export default class CreateLiftOneTutorForRegisterValidator {
	constructor(protected ctx: HttpContextContract) {
		console.log("lift one for register");
	}

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
		name: schema.string({}),
		document: schema.string({}, []),
		birthDate: schema.date(),
		gender: schema.enum(Object.values(PatientGender), []),
		email: schema.string([rules.email()]),
		cellphone: schema.string(),
		clientOriginId: schema.string([
			rules.exists({ table: "client_origins", column: "id" }),
		]),
		postalCode: schema.string(),
		street: schema.string(),
		number: schema.string(),
		complement: schema.string(),
		district: schema.string(),
		city: schema.string(),
		state: schema.string(),
		origin: schema.string(),
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
