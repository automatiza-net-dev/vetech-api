import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import {
	PatientGender,
	PatientType,
	PatientVaccineOrigin,
} from "App/Models/Patient";

export default class UpdatePatientValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		name: schema.string({}),
		type: schema.enum(Object.values(PatientType), []),
		photo: schema.file.optional({
			extnames: ["jpg", "gif", "png", "jpeg"],
		}),
		gender: schema.enum.optional(Object.values(PatientGender), []),
		tags: schema.string.optional({}, []),
		birthDate: schema.date({}),
		active: schema.boolean([]),
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
		community: schema.boolean.optional(),
		microchip: schema.string.optional(),
		death: schema.boolean(),
		deathDate: schema.date.optional(),
		hypertension: schema.boolean.optional(),
		diabetes: schema.boolean.optional(),
		glycemia: schema.number.optional(),
		pressure: schema.string.optional(),

		technicianId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "users", column: "id" }),
		]),
		deathObservation: schema.string.optional(),
		holders: schema.array().members(
			schema.object().members({
				id: schema.string({}, [
					rules.uuid(),
					rules.exists({ table: "patients", column: "id" }),
				]),
				main: schema.boolean(),
			}),
		),
	});

	public messages: CustomMessages = {};
}
