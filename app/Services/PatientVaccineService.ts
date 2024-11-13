import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import AnimalTimeline from "App/Models/mongoose/AnimalTimeline";
import TimelineType from "App/Models/TimelineType";
import User from "App/Models/User";
import { VaccineType } from "App/Models/Vaccine";
import VaccineCalendar from "App/Models/VaccineCalendar";
import VaccineProtocol from "App/Models/VaccineProtocol";
import { AuthContext } from "App/Services/SharedService";
import IPatientVaccineData from "Contracts/interfaces/IPatientVaccineData";
import { DateTime } from "luxon";

import PatientVaccine from "../Models/PatientVaccine";

type ISearch = {
	vaccine?: string;
	protocol?: string;
	patient?: string;
};

@inject()
export default class PatientVaccineService {
	public async index(unitId: string, data: ISearch) {
		const qb = PatientVaccine.query();

		qb.where("business_unit_id", unitId);

		if (data.vaccine) {
			qb.where("vaccine_id", data.vaccine);
		}

		if (data.protocol) {
			qb.where("vaccine_protocol_id", data.protocol);
		}

		if (data.patient) {
			qb.where("patient_id", data.patient);
		}

		await Promise.all([
			qb.preload("vaccine"),
			qb.preload("protocol"),
			qb.preload("patient"),
			qb.preload("user", (query) => {
				query.select("id", "name", "email");
			}),
			qb.preload("schedule"),
			qb.preload("calendars", (query) => {
				query.orderBy("dose");
			}),
		]);

		return qb;
	}

	public async store(authCtx: AuthContext, data: IPatientVaccineData) {
		return Database.transaction(async (trx) => {
			const protocol = await VaccineProtocol.query()
				.where("id", data.vaccineProtocolId)
				.preload("vaccine")
				.firstOrFail();

			const entity = await PatientVaccine.create(
				{
					business_unit_id: authCtx.unit.id,
					user_id: data.userId ?? authCtx.user.id,
					patient_id: data.patientId,
					vaccine_id: data.vaccineId,
					vaccine_protocol_id: data.vaccineProtocolId,
					schedule_id: data.scheduleId,

					status: "Incompleto",
				},
				{
					client: trx,
				},
			);

			const calendars: Array<Partial<VaccineCalendar>> = Array.from(
				{ length: protocol.doses },
				(_, index) => {
					const schedulingDate = data.applications?.find(
						(application) => application.dose === index + 1,
					)?.date;

					return {
						schedulingDate:
							schedulingDate ??
							DateTime.now().plus({
								days: index * protocol.interval,
							}),
						dose: index + 1,
						schedule_id: data.scheduleId,
						user_id: data.userId ?? authCtx.user.id,
					};
				},
			);

			const dbCalendars = await entity
				.related("calendars")
				.createMany(calendars, trx);

			const vaccineTimeline = await TimelineType.firstOrCreate(
				{
					description:
						protocol.vaccine.type === VaccineType.VACCINE
							? "Vacinas"
							: "Vermifugos",
					system_id: authCtx.system.id,
				},
				{
					description:
						protocol.vaccine.type === VaccineType.VACCINE
							? "Vacinas"
							: "Vermifugos",
					color: "#000",
					requiresObservation: false,
					system_id: authCtx.system.id,
				},
				{
					client: trx,
				},
			);

			await AnimalTimeline.create({
				timeline_id: vaccineTimeline.id,
				timeline_type: {
					description: vaccineTimeline.description,
					color: vaccineTimeline.color,
					requires_observation: vaccineTimeline.requiresObservation,
				},
				timeline_info: {
					tag: entity.patient_id,
					origin:
						protocol.vaccine.type === VaccineType.VACCINE
							? "new_vaccine"
							: "new_vermifuge",
					patient_vaccine: {
						id: entity.id,
					},
					technician: {
						id: authCtx.user.id,
						name: authCtx.user.name,
					},
					vaccine: {
						id: protocol.vaccine.id,
						name: protocol.vaccine.name,
						description: protocol.vaccine.description,
						origin: "new",
					},
					protocol: {
						id: protocol.id,
					},
					issuedAt: new Date(),
					startsAt: dbCalendars.at(0)?.schedulingDate,
				},
			});

			return entity;
		});
	}

	public async show(unitId: string, id: string) {
		const qb = PatientVaccine.query()
			.where("id", id)
			.where("business_unit_id", unitId)
			.preload("vaccine", (query) => {
				query.preload("subgroup");
			})
			.preload("protocol")
			.preload("patient")
			.preload("user", (query) => {
				query.select("id", "name", "email");
			})
			.preload("schedule")
			.preload("calendars");

		const entity = await qb.first();

		if (!entity) {
			throw new ResourceNotFoundException("Recurso não encontrado");
		}

		return entity;
	}

	public async update(
		unitId: string,
		id: string,
		user: User,
		data: Omit<IPatientVaccineData, "applications">,
	) {
		const entity = await this.show(unitId, id);

		entity.merge({
			business_unit_id: unitId,
			user_id: data.userId ?? user.id,
			patient_id: data.patientId,
			vaccine_id: data.vaccineId,
			vaccine_protocol_id: data.vaccineProtocolId,
			schedule_id: data.scheduleId,
		});

		return await entity.save();
	}

	public async destroy(unitId: string, id: string) {
		const entity = await this.show(unitId, id);

		await entity.softDelete();
	}
}
