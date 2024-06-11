import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Attendance from "App/Models/Attendance";
import AnimalTimeline from "App/Models/mongoose/AnimalTimeline";
import Patient from "App/Models/Patient";
import Schedule from "App/Models/Schedule";
import ScheduleServiceType from "App/Models/ScheduleServiceType";
import ScheduleStatus from "App/Models/ScheduleStatus";
import TimelineType from "App/Models/TimelineType";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { ICreateTreatment } from "Contracts/interfaces/ITreatmentData";
import { DateTime } from "luxon";
import { v4 } from "uuid";

interface ISearch {
	description?: string;
	resume?: string;
	patient?: string;
	tutor?: string;
}

@inject()
export default class AttendanceService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(unitId: string, data: ISearch) {
		const qb = Attendance.query()
			.where("business_unit_id", unitId)
			.preload("scheduleService");

		if (data.resume) {
			qb.whereILike("resume", `%${data.resume}`);
		}

		if (data.patient) {
			qb.where("patient_id", data.patient);
		}

		if (data.tutor) {
			qb.where("tutor_id", data.tutor);
		}

		if (data.description) {
			qb.whereHas("scheduleService", (query) => {
				query.whereILike("description", `%${data.description}`);
			});
		}

		return qb;
	}

	public async show(unitId: string, id: string) {
		const attendance = await Attendance.query()
			.where("business_unit_id", unitId)
			.where("id", id)
			.preload("scheduleService")
			.first();

		if (!attendance) {
			throw this.sharedService.ResourceNotFound();
		}

		return attendance;
	}

	public async open(authCtx: AuthContext, data: ICreateTreatment) {
		if (!data.scheduleId && !data.patientId) {
			throw new BadRequestException(
				"É preciso informar agendamento ou paciente",
				400,
				"E_ERR",
			);
		}

		const parsedData: Partial<Attendance> = {
			business_unit_id: authCtx.unit.id,
			open_user_id: authCtx.user.id,
			schedule_service_id: data.scheduleServiceId,
			resume: data.resume,
			protocol: data.protocol,
			internalObservation: data.internalObservation,
			startDate: DateTime.now(),
		};

		return await Database.transaction(async (trx) => {
			const serviceType = await ScheduleServiceType.findOrFail(
				data.scheduleServiceId,
				{
					client: trx,
				},
			);

			if (data.scheduleId) {
				const schedule = await Schedule.findOrFail(data.scheduleId, {
					client: trx,
				});

				parsedData.schedule_id = data.scheduleId;
				parsedData.patient_id = schedule.patient_id;
				parsedData.tutor_id = schedule.holder_id;
			} else {
				const patient = await Patient.query()
					.useTransaction(trx)
					.where("id", data.patientId ?? v4())
					.preload("tutors", (query) => {
						query.preload("tutor").pivotColumns(["is_main"]);
					})
					.firstOrFail();
				const mainTutor = patient.tutors.find((t) => t.$extras.pivot_is_main);

				if (!mainTutor) {
					throw new BadRequestException(
						"Paciente sem tutor ativo",
						400,
						"E_ERR",
					);
				}

				parsedData.patient_id = data.patientId;
				parsedData.tutor_id = mainTutor.id;

				const validPatientSchedule = await Schedule.query()
					.useTransaction(trx)
					.where("patient_id", patient.id)
					.whereHas("serviceStatus", (query) => {
						query.whereIn("type", [
							"AC",
							"AN",
							"ATR",
							"ATEND",
							"CIR",
							"OBS",
							"INT",
							"REC",
						]);
					})
					.orderBy("start_hour", "desc")
					.first();

				if (validPatientSchedule) {
					parsedData.schedule_id = validPatientSchedule.id;
				} else {
					const status = await ScheduleStatus.query()
						.useTransaction(trx)
						.where("description", "Em atendimento")
						.firstOrFail();

					const result = await Schedule.create(
						{
							business_unit_id: authCtx.unit.id,
							schedule_service_type_id: data.scheduleServiceId,
							schedule_status_id: status.id,
							user_id: authCtx.user.id,
							holder_id: mainTutor.id,
							patient_id: patient.id,
							startHour: DateTime.now().minus({ hours: 3 }),
							endHour: DateTime.now()
								.minus({
									hours: 3,
								})
								.plus({
									minutes: serviceType.reservedMinutes,
								}),
							majorComplaint: data.resume,
							onDuty: false,
						},
						{
							client: trx,
						},
					);

					parsedData.schedule_id = result.id;
				}
			}

			const model = await Attendance.create(parsedData, {
				client: trx,
			});

			const timeline = await TimelineType.firstOrCreate(
				{
					description: SharedService.GetAttendanceLabel(authCtx),
					system_id: authCtx.system.id,
				},
				{
					description: SharedService.GetAttendanceLabel(authCtx),
					color: "#000",
					requiresObservation: false,
					system_id: authCtx.system.id,
				},
				{
					client: trx,
				},
			);

			return await AnimalTimeline.create({
				timeline_id: timeline.id,
				timeline_type: {
					description: timeline.description,
					color: timeline.color,
					requires_observation: timeline.requiresObservation,
				},
				timeline_info: {
					tag: model.patient_id,
					realizedAt: DateTime.now(),
					finishedAt: null,
					resume: data.resume,
					protocol: data.protocol,
					internalObservation: data.internalObservation,
					technician: {
						id: authCtx.user.id,
						name: authCtx.user.name,
					},
					attendance: {
						id: model.id,
					},
					service: {
						id: serviceType.id,
						resume: serviceType.resume,
						description: serviceType.description,
					},
				},
			});
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: { resume?: string; protocol: string; internalObservation?: string },
	) {
		const model = await this.show(authCtx.unit.id, id);

		await Database.transaction(async (trx) => {
			await model
				.useTransaction(trx)
				.merge({
					resume: data.resume,
					protocol: data.protocol,
					internalObservation: data.internalObservation,
				})
				.save();

			// const timeline = await TimelineType.firstOrCreate(
			//   {
			//     description: 'Consulta',
			//     system_id: authCtx.system.id,
			//   },
			//   {
			//     description: 'Consulta',
			//     color: '#000',
			//     requiresObservation: false,
			//     system_id: authCtx.system.id,
			//   },
			//   {
			//     client: trx,
			//   },
			// );

			await AnimalTimeline.updateOne(
				{
					// timeline_id: timeline.id,
					"timeline_info.tag": model.patient_id,
					"timeline_info.attendance.id": model.id,
				},
				{
					$set: {
						"timeline_info.resume": data.resume,
						"timeline_info.protocol": data.protocol,
						"timeline_info.internalObservation":
							data.internalObservation ?? null,
					},
				},
				{},
			);
		});
	}

	public async close(authCtx: AuthContext, id: string) {
		const model = await this.show(authCtx.unit.id, id);

		if (model.endDate) {
			throw new BadRequestException("Atendimento já finalizado", 400, "E_ERR");
		}

		await Database.transaction(async (trx) => {
			await model
				.merge({ endDate: DateTime.now(), close_user_id: authCtx.user.id })
				.useTransaction(trx)
				.save();

			// const timelineInfo = await TimelineType.firstOrCreate(
			//   {
			//     description: SharedService.GetAttendanceLabel(authCtx),
			//     system_id: authCtx.system.id,
			//   },
			//   {
			//     color: '#000000',
			//     description: SharedService.GetAttendanceLabel(authCtx),
			//     requiresObservation: false,
			//     system_id: authCtx.system.id,
			//   },
			//   {
			//     client: trx,
			//   },
			// );

			await AnimalTimeline.updateMany(
				{
					// timeline_id: timelineInfo.id,
					"timeline_info.tag": model.patient_id,
					"timeline_info.finishedAt": null,
					"timeline_info.attendance.id": model.id,
				},
				{
					$set: {
						"timeline_info.finishedAt": DateTime.now().toJSDate(),
					},
				},
				{},
			);
		});
	}
}
