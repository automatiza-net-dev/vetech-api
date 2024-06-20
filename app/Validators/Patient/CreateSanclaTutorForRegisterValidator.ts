import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { PatientGender } from "App/Models/Patient";
import { PatientContactType } from "App/Models/PatientContact";

export default class CreateSanclaTutorForRegisterValidator {
	constructor(protected ctx: HttpContextContract) {
		console.log("sancla for register");
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
		clientOriginItemDescription: schema.string.optional({}, []),
		gender: schema.enum(Object.values(PatientGender), []),
		email: schema.string([rules.email()]),
		cellphone: schema.string(),
		clientOriginId: schema.string([
			rules.exists({ table: "client_origins", column: "id" }),
		]),
		professionId: schema.number([
			rules.exists({ table: "professions", column: "id" }),
		]),
		address: schema.object().members({
			zipCode: schema.string(),
			street: schema.string(),
			number: schema.string(),
			complement: schema.string(),
			district: schema.string(),
			city: schema.string(),
			state: schema.string(),
		}),
		origin: schema.string(),
		contacts: schema.array().members(
			schema.object().members({
				main: schema.boolean(),
				notGiven: schema.boolean(),
				contact: schema.string.optional({ trim: true }, [rules.emailContato()]),
				observation: schema.string.optional(),
				type: schema.enum(Object.values(PatientContactType)),
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
