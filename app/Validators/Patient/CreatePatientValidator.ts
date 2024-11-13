import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { PatientGender, PatientVaccineOrigin } from "App/Models/Patient";

export default class CreatePatientValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		name: schema.string({}),
		holders: schema.array().members(
			schema.object().members({
				id: schema.string({}, [
					rules.uuid(),
					rules.exists({ table: "patients", column: "id" }),
				]),
				main: schema.boolean(),
			}),
		),

		photo: schema.file.optional({
			extnames: ["jpg", "gif", "png", "jpeg"],
		}),
		gender: schema.enum.optional(Object.values(PatientGender), []),
		tags: schema.string.optional({}, []),
		birthDate:
			this.ctx.request.input("birthDate_change", "false") === "false"
				? schema.date()
				: schema.date.optional(),
		birthDays:
			this.ctx.request.input("birthDate_change", "false") === "true"
				? schema.number([])
				: schema.number.optional(),
		birthMonths:
			this.ctx.request.input("birthDate_change", "false") === "true"
				? schema.number([])
				: schema.number.optional(),
		birthYears:
			this.ctx.request.input("birthDate_change", "false") === "true"
				? schema.number([])
				: schema.number.optional(),
		// holderId: schema.string.optional({}, [
		// 	rules.uuid(),
		// 	rules.exists({ table: "patients", column: "id" }),
		// ]),
		raceId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "races", column: "id" }),
		]),
		vaccineOrigin: schema.enum.optional(
			Object.values(PatientVaccineOrigin),
			[],
		),
		hairId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "patient_animal_hairs", column: "id" }),
		]),
		castrated: schema.boolean.optional(),
		microchip: schema.string.optional(),
		hypertension: schema.boolean.optional(),
		community: schema.boolean.optional(),
		diabetes: schema.boolean.optional(),
		glycemia: schema.number.optional(),
		pressure: schema.string.optional(),
	});

	public messages: CustomMessages = {};
}
