import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { PatientGender } from "App/Models/Patient";
import { PatientContactType } from "App/Models/PatientContact";
import { TutorResidences } from "App/Models/PatientTutor";

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
		inscription: schema.string.optional({}, []),
		birthDate: schema.date.optional({}),
		birthMonths:
			this.ctx.request.input("birthDate", "") !== ""
				? schema.number.optional([])
				: schema.number(),
		birthYears:
			this.ctx.request.input("birthDate", "") !== ""
				? schema.number.optional([])
				: schema.number(),
		clientOriginItemDescription: schema.string.optional({}, []),
		gender: schema.enum(Object.values(PatientGender), []),
		clientOriginId: schema.string([
			rules.exists({ table: "client_origins", column: "id" }),
		]),
		address: schema.object().members({
			zipCode: schema.string(),
			logradouro: schema.string(),
			number: schema.string(),
			complemento: schema.string.optional(),
			bairro: schema.string(),
			localidade: schema.string(),
			uf: schema.string(),
			residence: schema.enum(TutorResidences),
			ibge: schema.string.optional(),
		}),
		origin: schema.string(),
		contacts: schema.array().members(
			schema.object().members({
				main: schema.boolean(),
				notGiven: schema.boolean(),
				observation: schema.string.optional(),
				contact: schema.string.optional({ trim: true }, [rules.emailContato()]),
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
