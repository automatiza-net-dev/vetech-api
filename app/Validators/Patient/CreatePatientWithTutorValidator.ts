import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { PatientGender } from "App/Models/Patient";
import { PatientContactType } from "App/Models/PatientContact";
import { TutorResidences } from "App/Models/PatientTutor";

export default class CreatePatientWithTutorValidator {
	constructor(protected ctx: HttpContextContract) {
		console.log("fallback");
	}

	public schema = schema.create({
		name: schema.string({}),

		clientOriginItemDescription: schema.string.optional({}, []),
		residence: schema.enum.optional(TutorResidences),
		photo: schema.file.optional({
			extnames: ["jpg", "gif", "png", "jpeg"],
		}),
		gender: schema.enum.optional(Object.values(PatientGender), []),
		tags: schema.string.optional({}, []),
		birthDate: schema.date.optional({}),
		document: schema.string.optional({}, []),
		inscription: schema.string.optional({}, []),
		corporate_name: schema.string.optional({}, []),
		email: schema.string.optional({}, [rules.email()]),
		cellphone: schema.string.optional({}, []),
		telephone: schema.string.optional({}, []),
		message_person_name: schema.string.optional({}, []),
		message_person_phone: schema.string.optional({}, []),
		postalCode: schema.string.optional({}, []),
		street: schema.string.optional({}, []),
		number: schema.string.optional({}, []),
		complement: schema.string.optional({}, []),
		district: schema.string.optional({}, []),
		city: schema.string.optional({}, []),
		state: schema.string.optional({}, []),
		clientOriginId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "client_origins", column: "id" }),
		]),
		cityCode: schema.string.optional({}),
		hypertension: schema.boolean.optional(),
		diabetes: schema.boolean.optional(),
		professionId: schema.number.optional([
			rules.exists({ table: "professions", column: "id" }),
		]),
		nationality: schema.string.optional({}, []),
		civilStatus: schema.string.optional({}, []),
		contacts: schema.array().members(
			schema.object().members({
				main: schema.boolean(),
				notGiven: schema.boolean(),
				contact: schema.string.optional(),
				observation: schema.string.optional(),
				type: schema.enum(Object.values(PatientContactType)),
			}),
		),
	});

	public messages: CustomMessages = {};
}
