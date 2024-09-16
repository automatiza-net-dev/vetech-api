import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";
import WeekDay from "App/Models/shared/WeekDay";

export default class UpdateUnavailableDayValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		title: schema.string(),
		frequency: schema.array().members(schema.enum(Object.values(WeekDay), [])),
		startDate: schema.date.optional({}),
		endDate: schema.date.optional({}),
		startHour: schema.string({}),
		endHour: schema.string({}),
		active: schema.boolean([]),
	});

	public messages: CustomMessages = {
		"startDate.date_format": "O campo de data de início deve ser um dia válido",
		"endDate.date_format": "O campo de data de fim deve ser um dia válido",
		"startHour.date_format":
			"O campo de hora de início deve ser um horário válido",
		"endHour.date_format": "O campo de hora de fim deve ser um horário válido",
		"title.required": "O título é obrigatório e está faltando",
		"startHour.required": "A hora de início é obrigatório e está faltando",
		"endHour.required": "A hora de fim é obrigatório e está faltando",
	};
}
