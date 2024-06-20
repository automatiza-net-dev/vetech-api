import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { PatientGender } from "App/Models/Patient";
import { PatientContactType } from "App/Models/PatientContact";
import { TutorResidences } from "App/Models/PatientTutor";

export default class UpdatePatientWithTutorValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		name: schema.string({}),

		clientOriginItemDescription: schema.string.optional({}, []),
		photo: schema.file.optional({
			extnames: ["jpg", "gif", "png", "jpeg"],
		}),
		gender: schema.enum.optional(Object.values(PatientGender), []),
		tags: schema.string.optional({}, []),
		birthDate: schema.date({}),
		active: schema.boolean([]),
		document: schema.string({}, []),
		inscription: schema.string.optional({}, []),
		corporate_name: schema.string.optional({}, []),
		telephone: schema.string.optional({}, []),
		message_person_name: schema.string.optional({}, []),
		message_person_phone: schema.string.optional({}, []),
		address: schema.object().members({
			zipCode: schema.string(),
			logradouro: schema.string(),
			number: schema.string(),
			complemento: schema.string(),
			bairro: schema.string(),
			localidade: schema.string(),
			uf: schema.string(),
			residence: schema.enum(TutorResidences),
		}),
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
				contact: schema.string.optional({ trim: true }, [rules.emailContato()]),
				observation: schema.string.optional(),
				type: schema.enum(Object.values(PatientContactType)),
			}),
		),
	});

	public messages: CustomMessages = {};
}
