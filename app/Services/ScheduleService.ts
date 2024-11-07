import { inject } from "@adonisjs/fold";
import { string } from "@ioc:Adonis/Core/Helpers";
import Database from "@ioc:Adonis/Lucid/Database";
import type { ModelObject } from "@ioc:Adonis/Lucid/Orm";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Patient from "App/Models/Patient";
import Reason from "App/Models/Reason";
import Schedule from "App/Models/Schedule";
import ScheduleServiceType from "App/Models/ScheduleServiceType";
import ScheduleStatus, {
	ScheduleStatusType,
	VALID_CHANGES,
} from "App/Models/ScheduleStatus";
import UnavailableDay from "App/Models/UnavailableDay";
import User from "App/Models/User";
import WorkingDay from "App/Models/WorkingDay";
import WeekDay from "App/Models/shared/WeekDay";
import OpportunityService from "App/Services/OpportunityService";
import SharedService from "App/Services/SharedService";
import type { AuthContext, DateSet } from "App/Services/SharedService";
import type IScheduleContactData from "Contracts/interfaces/IScheduleContactData";
import type IScheduleData from "Contracts/interfaces/IScheduleData";
import type { IRescheduleData } from "Contracts/interfaces/IScheduleData";
import type IUpdateScheduleStatus from "Contracts/interfaces/IUpdateScheduleStatus";
import type IViewDailyServicesRequest from "Contracts/interfaces/IViewDailyServicesRequest";
import type IViewDisponibilityRequest from "Contracts/interfaces/IViewDisponibilityRequest";
import {
	addDays,
	differenceInDays,
	differenceInMinutes,
	endOfDay,
	format,
	intervalToDuration,
	isAfter,
	isSameDay,
	startOfDay,
} from "date-fns";
import { DateTime } from "luxon";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import Opportunity from "App/Models/Opportunity";
import { v4 } from "uuid";
import CrmStatus from "App/Models/CrmStatus";
import TreatmentExecution from "App/Models/TreatmentExecution";
import { flatten } from "@poppinss/utils";

interface ISearch {
	pid?: string;
	patient?: string;
	complaint?: string;
}

interface IHomeSearch {
	confirmed?: string;
	unit?: string;
	page?: number;
	per_page?: number;
}

@inject()
export default class ScheduleService {
	constructor(
		private readonly sharedService: SharedService,
		private opportunityService: OpportunityService,
	) {}

	public async homeContent(authCtx: AuthContext, data: IHomeSearch) {
		const qb = Schedule.query()
			.where("business_unit_id", data.unit ?? authCtx.unit.id)
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.preload("race", (query) => {
						query.preload("specie");
					});
				});
			})
			.preload("holder", (query) => {
				query.preload("tutor");
			})
			.preload("serviceType")
			.preload("serviceStatus")
			.preload("user")
			.orderBy("start_hour", "asc");

		if (data.confirmed === "false") {
			qb.whereHas("serviceStatus", (query) => {
				query.where("type", "AN");
			});
		} else {
			qb.whereHas("serviceStatus", (query) => {
				query.whereIn("type", ["AC", "REC", "ATEND", "ATR", "CIR"]);
			});
		}

		if (!authCtx.unit.unitConfig.dashboardListsRetroactiveSchedules) {
			qb.whereRaw("schedules.start_hour::date >= now()::date", []);
		}

		const result = await qb.paginate(data.page ?? 1, data.per_page ?? 10);

		return result;
	}

	public async homeContent_2(
		authCtx: AuthContext,
		data: Pick<IHomeSearch, "unit">,
	) {
		const hasPermissionNotConfirmed =
			await this.sharedService.userHasPermission(authCtx, "PRI01");
		const hasPermissionConfirmed = await this.sharedService.userHasPermission(
			authCtx,
			"PRI02",
		);

		const confirmedQb = Schedule.query()
			.select(
				"patient_id",
				"holder_id",
				"schedule_service_type_id",
				"schedule_status_id",
				"user_id",
				"id",
				"patient_name",
				"patient_phone",
				"start_hour",
				"end_hour",
				"major_complaint",
				"observation",
			)
			.where("business_unit_id", data.unit ?? authCtx.unit.id)
			.whereHas("serviceStatus", (query) => {
				query.whereIn("type", ["AC", "REC", "ATEND", "ATR", "CIR"]);
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.select("race_id", "id", "death", "death_date");

					query.preload("race", (query) => {
						query.select("specie_id", "id", "description");
						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});

				query.select(["id", "name", "type", "photo", "gender", "tag"]);
			})
			.preload("user", (query) => {
				query.select(["id", "name"]);
			})
			.preload("holder", (query) => {
				query.preload("tutor", (query) => {
					query.select(["id", "cellphone", "telephone"]);
				});
				query.select(["id", "name", "type", "photo"]);
			})
			.preload("serviceType", (query) => {
				query.select(["id", "description", "reserved_minutes", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.orderBy("start_hour", "asc");

		const nonConfirmedQb = Schedule.query()
			.select(
				"patient_id",
				"holder_id",
				"schedule_service_type_id",
				"schedule_status_id",
				"user_id",
				"id",
				"patient_name",
				"patient_phone",
				"start_hour",
				"end_hour",
				"major_complaint",
				"observation",
			)
			.where("business_unit_id", data.unit ?? authCtx.unit.id)
			.whereHas("serviceStatus", (query) => {
				query.where("type", "AN");
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal", (query) => {
					query.select("race_id", "id", "death", "death_date");

					query.preload("race", (query) => {
						query.select("specie_id", "id", "description");
						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});

				query.select(["id", "name", "type", "photo", "gender", "tag"]);
			})
			.preload("user", (query) => {
				query.select(["id", "name"]);
			})
			.preload("holder", (query) => {
				query.preload("tutor", (query) => {
					query.select(["id", "cellphone", "telephone"]);
				});
				query.select(["id", "name", "type", "photo"]);
			})
			.preload("serviceType", (query) => {
				query.select(["id", "description", "reserved_minutes", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.orderBy("start_hour", "asc");

		if (!hasPermissionConfirmed) {
			confirmedQb.whereRaw("0 = 1");
		}
		if (!hasPermissionNotConfirmed) {
			nonConfirmedQb.whereRaw("0 = 1");
		}

		if (!authCtx.unit.unitConfig.dashboardListsRetroactiveSchedules) {
			confirmedQb.whereRaw("schedules.start_hour::date >= now()::date", []);
			nonConfirmedQb.whereRaw("schedules.start_hour::date >= now()::date", []);
		}

		const [confirmedSchedules, nonConfirmedSchedules] = await Promise.all([
			confirmedQb,
			nonConfirmedQb,
		]);

		const executions: {
			tipo_registro: string;
			description: string;
			label: string;
			reserved_minutes: number;
			treatment_id: number;
			treatment_item_id: number;
			treatment_execution_id: number;
			schedule_id: string;
		}[] = await Database.from("treatment_executions")
			.select(
				Database.raw(
					`
                'Tratamento'                                             as tipo_registro,
       'Tratamentos - Execuções'                                as description,
       products.description || ' - ' || productivity_items.description as label,
       productivity_items.reserved_minutes,
       treatment_executions.treatment_id                        as treatment_id,
       treatment_executions.treatment_item_id                   as treatment_item_id,
       treatment_executions.id                                  as treatment_execution_id,
       treatment_executions.schedule_id
       `,
					[],
				),
			)
			.joinRaw(
				"join productivity_items on treatment_executions.productivity_item_id = productivity_items.id",
			)
			.joinRaw(
				`join (treatment_items join product_variations on product_variations.id = treatment_items.product_variation_id join products
               on product_variations.product_id = products.id)
              on treatment_executions.treatment_item_id = treatment_items.id and
                 treatment_executions.treatment_id = treatment_items.treatment_id`,
			)
			.joinRaw(
				"join treatments on treatment_executions.treatment_id = treatments.id",
			)
			.where("treatments.economic_group_id", authCtx.group.id)
			.where("treatments.business_unit_id", authCtx.unit.id)
			.whereNotNull("treatment_executions.schedule_id")
			.orderByRaw("1, 4, 3, 7");

		return {
			confirmed: confirmedSchedules
				.map((day) => {
					Object.assign(day, {
						executions: executions.filter((ex) => ex.schedule_id === day.id),
					});

					return day;
				})
				.map((day) => ({
					start: day.startHour.toString(),
					end: day.endHour.toString(),
					event: day,
					name: day.user?.name ?? "-",
					date: day.startHour.setLocale("pt-BR").toFormat("dd/MM/yy - HH:mm"),
					late:
						isAfter(new Date(), day.startHour.plus({ hours: 3 }).toJSDate()) &&
						["AN", "AC", "ATR"].includes(day.serviceStatus.type)
							? differenceInMinutes(
									new Date(),
									day.startHour.plus({ hours: 3 }).toJSDate(),
								)
							: null,
					type: this.getEventLabel(day),
				})),

			nonConfirmed: nonConfirmedSchedules
				.map((day) => {
					Object.assign(day, {
						executions: executions.filter((ex) => ex.schedule_id === day.id),
					});

					return day;
				})
				.map((day) => ({
					start: day.startHour.toString(),
					end: day.endHour.toString(),
					event: day,
					name: day.user?.name ?? "-",
					date: day.startHour.setLocale("pt-BR").toFormat("dd/MM/yy - HH:mm"),
					late:
						isAfter(new Date(), day.startHour.plus({ hours: 3 }).toJSDate()) &&
						["AN", "AC", "ATR"].includes(day.serviceStatus.type)
							? differenceInMinutes(
									new Date(),
									day.startHour.plus({ hours: 3 }).toJSDate(),
								)
							: null,
					type: this.getEventLabel(day),
				})),
		};
	}

	public async index(unitId: string, data: ISearch): Promise<Array<Schedule>> {
		const qb = Schedule.query()
			.where("business_unit_id", unitId)
			.preload("serviceType", (query) => {
				query.select(["id", "description", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.preload("patient", (query) => {
				query.select(["id", "name", "gender"]);
			})
			.preload("holder", (query) => {
				query.select(["id", "name"]);
				query.preload("tutor", (query) => {
					query.select(["cellphone", "telephone"]);
				});
			})
			.preload("reschedules", (query) => {
				query.preload("reason");
				query.preload("user", (query) => query.select(["id", "name", "email"]));
			})
			.preload("scheduleOrigin")
			.preload("scheduleReturn");

		if (data.pid) {
			qb.where("patient_id", data.pid);
		}

		if (data.patient) {
			qb.where("patient_name", "ilike", `%${data.patient}%`);
		}

		if (data.complaint) {
			qb.where("major_complaint", "ilike", `%${data.complaint}%`);
		}

		return qb;
	}

	public async usersWithSchedule(authCtx: AuthContext) {
		const qb = Database.from("users")
			.select(Database.raw(`distinct users.id, users.name, users.on_duty`))
			.joinRaw(
				`join user_unit_roles on users.id = user_unit_roles.user_id and user_unit_roles.active is true`,
			)
			.joinRaw(
				`left join working_days
                   on user_unit_roles.unit_id = working_days.business_unit_id and working_days.user_id = users.id`,
				[],
			)
			.joinRaw(
				`left join schedules on schedules.user_id = users.id and schedules.business_unit_id = user_unit_roles.unit_id`,
			)
			.where("user_unit_roles.unit_id", authCtx.unit.id)
			.where("users.type", "user")
			.whereRaw(
				`((users.on_duty = true) or (working_days.id is not null) or (schedules.id is not null))`,
			);

		const hasPermission = await this.sharedService.userHasPermission(
			authCtx,
			"AGE10",
		);

		if (!hasPermission) {
			qb.where("users.id", authCtx.user.id);
		}

		return qb;
	}

	public async returnableSchedules(authCtx: AuthContext, patientId: string) {
		return Database.from("schedules")
			.select(
				Database.raw(
					"schedules.id, schedules.schedule_service_type_id, schedule_service_types.description, schedules.start_hour",
				),
			)
			.joinRaw(
				"join business_unit_configs on schedules.business_unit_id = business_unit_configs.business_unit_id",
			)
			.joinRaw(
				"join schedule_service_types on schedules.schedule_service_type_id = schedule_service_types.id",
			)
			.where("schedules.business_unit_id", authCtx.unit.id)
			.where("schedules.patient_id", patientId)
			.whereNull("schedules.deleted_at")
			.whereNull("schedules.schedule_origin_id")
			.whereRaw(
				"now()::date - start_hour::date <= business_unit_configs.return_interval",
				[],
			)
			.whereRaw(`business_unit_configs.allowed_return_qty >
      (select count(s1.id) from schedules s1 where s1.schedule_origin_id = schedules.id)
  and exists (select id
              from "schedule_service_types"
              where ("allow_return" = true)
                and ("schedule_service_types"."id" = "schedules"."schedule_service_type_id"))`);
	}

	public async store(authCtx: AuthContext, data: IScheduleData) {
		if (data.userId) {
			const scheduleUser = await User.findOrFail(data.userId);

			if (!scheduleUser.onDuty) {
				// AGE12 é a permissão para agendar em horários bloqueados
				// const hasPermission = await this.sharedService.userHasPermission(
				//   scheduleUser,
				//   'AGE12',
				// );

				const result = await ScheduleService.checkDisponibility(
					data.userId ?? authCtx.user.id,
					authCtx.unit.id,
					{
						start: data.startHour.toJSDate(),
						end: data.endHour.toJSDate(),
					},
				);

				if (result.invalidWorkingDay) {
					throw new BadRequestException(
						"Pessoa não trabalha neste horário",
						400,
						"E_BAD_REQUEST",
					);
				}

				// if (result.invalidUnavailableDay && !hasPermission) {
				if (result.invalidUnavailableDay && !data.ignoreBlocking) {
					throw new BadRequestException(
						"Pessoa não está disponível neste horário",
						400,
						"E_BAD_REQUEST",
					);
				}
			}

			if (!data.ignoreOverlapping) {
				const overlapping = await Schedule.query()
					.where("user_id", data.userId ?? authCtx.user.id)
					.andWhere("business_unit_id", authCtx.unit.id)
					.andWhereRaw(
						`
            (
              (
                (? BETWEEN start_hour AND end_hour) OR
                (? BETWEEN start_hour AND end_hour)
              )
              OR
              (
                (start_hour BETWEEN ? AND ?)
                OR
                (end_hour BETWEEN ? AND ?)
              )
            )
            `,
						[
							data.startHour.toJSDate(),
							data.endHour.minus({ minutes: 1 }).toJSDate(),
							data.startHour.toJSDate(),
							data.endHour.minus({ minutes: 1 }).toJSDate(),
							data.startHour.toJSDate(),
							data.endHour.minus({ minutes: 1 }).toJSDate(),
						],
					)
					.andWhereHas("serviceStatus", (query) => {
						query.whereNotIn("type", ["CANC"]);
					})
					.first();

				if (overlapping) {
					throw new BadRequestException(
						"Horário já está ocupado",
						400,
						"E_BAD_REQUEST",
					);
				}
			}
		}

		return Database.transaction(async (trx) => {
			const status = await ScheduleStatus.firstOrCreate(
				{
					description: "Agendado (Não confirmado)",
					system_id: authCtx.system.id,
					type: "AN",
				},
				{
					color: "#000000",
				},
				{
					client: trx,
				},
			);

			const scheduleType = await ScheduleServiceType.findOrFail(
				data.scheduleServiceTypeId,
				{
					client: trx,
				},
			);

			const result = await Schedule.create(
				{
					business_unit_id: authCtx.unit.id,
					schedule_status_id: status.id,
					holder_id: data.holderId,
					user_id: data.userId ?? authCtx.user.id,
					patient_id: data.patientId,
					race_id: data.raceId,
					schedule_service_type_id: data.scheduleServiceTypeId,
					// treatment_id: data.treatmentId,
					// treatment_item_id: data.treatmentItemId,
					// treatment_execution_id: data.treatmentExecutionId,

					patientName: data.patientName,
					patientPhone: data.patientPhone,
					age: data.age,
					startHour: data.startHour,
					endHour: data.endHour.minus({ minutes: 1 }),
					majorComplaint: data.majorComplaint,
					scheduleOriginId: data.scheduleOriginId,
					onDuty: data.onDuty,
				},
				{
					client: trx,
				},
			);

			const tasks =
				data.executions?.map(async (exec) => {
					return TreatmentExecution.query()
						.useTransaction(trx)
						.where("business_unit_id", authCtx.unit.id)
						.where("treatment_id", exec.treatmentId)
						.where("treatment_item_id", exec.treatmentItemId)
						.where("id", exec.treatmentExecutionId)
						.update({
							schedule_id: result.id,
						});
				}) ?? [];
			await Promise.all(tasks);

			await result.related("statusChanges").create(
				{
					user_id: authCtx.user.id,
					schedule_status_id: status.id,
					observation: "",
				},
				{
					client: trx,
				},
			);

			if (data.scheduleOriginId) {
				const origin = await Schedule.findOrFail(data.scheduleOriginId, {
					client: trx,
				});
				origin.scheduleReturnId = result.id;
				await origin.useTransaction(trx).save();
			}
			return {
				id: result.id,
				patientName: result.patientName,
				patientPhone: result.patientPhone,
				holder_id: result.holder_id,
				age: result.age,
				startHour: result.startHour,
				endHour: result.endHour,
				majorComplaint: result.majorComplaint,
				business_unit_id: authCtx.unit.id,
				user_id: result.user_id,
				patient_id: result.patient_id,
				race_id: result.race_id,
				schedule_service_type_id: result.schedule_service_type_id,
				schedule_service_type_type: scheduleType.type,
				schedule_status_id: status.id,
				scheduleOriginId: result.scheduleOriginId,
				onDuty: result.onDuty,
			};
		});
	}

	public async show(unitId: string, id: string): Promise<Schedule> {
		const schedule = await Schedule.query()
			.where("id", id)
			.andWhere("business_unit_id", unitId)
			.preload("serviceType", (query) => {
				query.select(["id", "description", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.preload("patient", (query) => {
				query.select(["id", "name", "gender", "tag"]);
			})
			.preload("holder", (query) => {
				query.select(["id", "name"]);
				query.preload("tutor", (query) => {
					query.select(["document", "cellphone", "telephone"]);
				});
			})
			.preload("reschedules", (query) => {
				query.preload("reason", (query) => query.select(["id", "reason"]));
				query.preload("user", (query) => query.select(["id", "name", "email"]));
			})
			.preload("statusChanges", (query) => {
				query.preload("reason", (query) => query.select(["id", "reason"]));
				query.preload("user", (query) => query.select(["id", "name", "email"]));
				query.preload("status", (query) => query.select(["id", "description"]));
			})
			.preload("reason", (query) => query.select(["id", "reason"]))
			.preload("contacts", (query) => {
				query.preload("user", (query) => query.select(["id", "name", "email"]));
				query.preload("status", (query) =>
					query.select(["id", "description", "color", "type"]),
				);
			})
			.preload("scheduleOrigin")
			.preload("scheduleReturn")
			.first();

		if (!schedule) {
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				400,
				"E_NOT_FOUND",
			);
		}

		return schedule;
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IScheduleData & {
			scheduleOriginId?: string;
			ignoreBlocking?: boolean;
		},
	): Promise<Schedule> {
		const schedule = await this.show(authCtx.unit.id, id);

		const _user = data.userId
			? await User.findOrFail(data.userId)
			: authCtx.user;
		if (_user.id !== schedule.user_id) {
			if (!_user.onDuty) {
				const result = await ScheduleService.checkDisponibility(
					data.userId ?? authCtx.user.id,
					authCtx.unit.id,
					{
						start: data.startHour.toJSDate(),
						end: data.endHour.toJSDate(),
					},
				);

				if (result.invalidWorkingDay) {
					throw new BadRequestException(
						"Pessoa não trabalha neste horário",
						400,
						"E_BAD_REQUEST",
					);
				}

				// if (result.invalidUnavailableDay && !hasPermission) {
				if (result.invalidUnavailableDay && !data.ignoreBlocking) {
					throw new BadRequestException(
						"Pessoa não está disponível neste horário",
						400,
						"E_BAD_REQUEST",
					);
				}
			}

			if (!data.ignoreOverlapping) {
				const overlapping = await Schedule.query()
					.where("user_id", data.userId ?? authCtx.user.id)
					.andWhere("business_unit_id", authCtx.unit.id)
					.andWhereRaw(
						`
            (
              (
                (? BETWEEN start_hour AND end_hour) OR
                (? BETWEEN start_hour AND end_hour)
              )
              OR
              (
                (start_hour BETWEEN ? AND ?)
                OR
                (end_hour BETWEEN ? AND ?)
              )
            )
            `,
						[
							data.startHour.toJSDate(),
							data.endHour.minus({ minutes: 1 }).toJSDate(),
							data.startHour.toJSDate(),
							data.endHour.minus({ minutes: 1 }).toJSDate(),
							data.startHour.toJSDate(),
							data.endHour.minus({ minutes: 1 }).toJSDate(),
						],
					)
					.andWhereHas("serviceStatus", (query) => {
						query.whereNotIn("type", ["CANC"]);
					})
					.first();

				if (overlapping) {
					throw new BadRequestException(
						"Horário já está ocupado",
						400,
						"E_BAD_REQUEST",
					);
				}
			}
		}

		return schedule
			.merge({
				patientName: data.patientName,
				patientPhone: data.patientPhone,
				holder_id: data.holderId,
				age: data.age,
				majorComplaint: data.majorComplaint,
				business_unit_id: authCtx.unit.id,
				user_id: _user.id,
				patient_id: data.patientId,
				race_id: data.raceId,
				schedule_service_type_id: data.scheduleServiceTypeId,
				onDuty: data.onDuty,
				startHour: data.startHour,
				endHour: data.endHour.minus({ minutes: 1 }),
			})
			.save();
	}

	public async reschedule(
		authCtx: AuthContext,
		id: string,
		data: IRescheduleData,
	) {
		const schedule = await this.show(authCtx.unit.id, id);

		return Database.transaction(async (trx) => {
			const technician = data.userId
				? await User.findOrFail(data.userId, { client: trx })
				: authCtx.user;

			if (!technician.onDuty || !data.ignoreOverlapping) {
				const result = await ScheduleService.checkDisponibility(
					technician.id,
					authCtx.unit.id,
					{
						start: data.startHour.toJSDate(),
						end: data.endHour.toJSDate(),
					},
				);

				if (result.invalidWorkingDay) {
					throw new BadRequestException(
						"Pessoa não trabalha neste horário",
						400,
						"E_BAD_REQUEST",
					);
				}

				if (result.invalidUnavailableDay && !data.ignoreBlocking) {
					throw new BadRequestException(
						"Pessoa não está disponível neste horário",
						400,
						"E_BAD_REQUEST",
					);
				}
			}

			if (data.reasonId) {
				const reason = await Reason.findOrFail(data.reasonId);
				if (reason.requiresObservation && !data.observation) {
					// throw new BadRequestException(
					// 	"É preciso informar observação",
					// 	400,
					// 	"E_MISSING",
					// );
					return {
						data: null,
						message: null,
						status: 422,
						title: "É preciso informar a observação",
						validationErrors: {
							observation: {
								errors: ["É preciso informar a observação"],
							},
						},
					};
				}
			}

			await schedule.related("reschedules").create(
				{
					update_user_id: authCtx.user.id,
					user_id: schedule.user_id,
					originalDate: schedule.startHour,
					reason_id: data.reasonId,
					observation: data.observation,
				},
				{ client: trx },
			);

			const status = await ScheduleStatus.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.where("type", "AN" as ScheduleStatusType)
				.first();

			if (!status) {
				throw new BadRequestException(
					"Não foi possível encontrar um status do tipo 'Não confirmado'",
					400,
					"E_ERR",
				);
			}

			await schedule.related("statusChanges").create(
				{
					user_id: authCtx.user.id,
					schedule_status_id: status.id,
					reason_id: data.reasonId,
					observation: data.observation,
				},
				{
					client: trx,
				},
			);

			return schedule
				.merge({
					schedule_status_id: status.id,
					user_id: technician.id,
					startHour: data.startHour,
					endHour: data.endHour,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async reopenSchedule(
		authCtx: AuthContext,
		id: string,
		data: { reasonId: string; statusId: string; observation: string },
	): Promise<Schedule> {
		const hasPermission = await this.sharedService.userHasPermission(
			authCtx,
			"AGE14",
		);
		if (!hasPermission) {
			throw new UnauthorizedException(
				"Usuário não tem permissão",
				400,
				"E_ERR",
			);
		}

		const schedule = await this.show(authCtx.unit.id, id);

		if (schedule.serviceStatus.type !== "CANC") {
			throw new BadRequestException(
				"Apenas agendas canceladas podem ser reabertas",
				400,
				"E_ERR",
			);
		}

		return Database.transaction(async (trx) => {
			await schedule.related("statusChanges").create(
				{
					user_id: authCtx.user.id,
					// schedule_status_id: schedule.schedule_status_id, // status antigo da agenda
					schedule_status_id: data.statusId, // novo status
					reason_id: data.reasonId,
					observation: data.observation,
				},
				{
					client: trx,
				},
			);

			return schedule
				.merge({
					schedule_status_id: data.statusId,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async upsertStatus(
		authCtx: AuthContext,
		id: string,
		data: { reasonId: string; statusId: string; observation: string },
	): Promise<Schedule> {
		const hasPermission = await this.sharedService.userHasPermission(
			authCtx,
			"AGE15",
		);
		if (!hasPermission) {
			throw new UnauthorizedException(
				"Usuário não tem permissão",
				400,
				"E_ERR",
			);
		}

		const schedule = await this.show(authCtx.unit.id, id);

		if (schedule.serviceStatus.type === "CANC") {
			throw new BadRequestException(
				"Não é possível fazer essa ação com agendas canceladas",
				400,
				"E_ERR",
			);
		}

		return Database.transaction(async (trx) => {
			await schedule.related("statusChanges").create(
				{
					user_id: authCtx.user.id,
					// schedule_status_id: schedule.schedule_status_id, // status antigo da agenda
					schedule_status_id: data.statusId, // status novo da agenda
					reason_id: data.reasonId,
					observation: data.observation,
				},
				{
					client: trx,
				},
			);
			return schedule
				.merge({
					schedule_status_id: data.statusId,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async destroy(authCtx: AuthContext, id: string): Promise<void> {
		return Database.transaction(async (trx) => {
			const hasPermission = await this.sharedService.userHasPermission(
				authCtx,
				"AGE13",
			);
			if (!hasPermission) {
				throw new UnauthorizedException(
					"Usuário não tem permissão",
					400,
					"E_ERR",
				);
			}

			const schedule = await this.show(authCtx.unit.id, id);

			await schedule
				.merge({
					deletedAt: DateTime.now(),
					exclusion_user_id: authCtx.user.id,
				})
				.useTransaction(trx)
				.save();

			await Opportunity.query()
				.useTransaction(trx)
				.where("schedule_id", schedule.id)
				.update({ schedule_id: null });
		});
	}

	public async searchDisponibility(data: IViewDisponibilityRequest) {
		const startDate = new Date(data.start);
		const endDate = new Date(data.end);

		const { days } = intervalToDuration({
			start: startDate,
			end: endDate,
		});

		const keys = Array.from({ length: (days ?? 0) + 1 }, (_, k) => {
			const tmpDate = addDays(startDate, k);

			return format(tmpDate, "yyyy-MM-dd");
		});

		const [wDays, uDays, schedules] = data.user
			? await this.getUserGeneralSchedules(
					data.user,
					data.business,
					startDate,
					endDate,
				)
			: await this.getGeneralSchedules(
					data.business,
					startOfDay(startDate),
					endOfDay(endDate),
				);

		return this.mapSchedulesToDays(keys, wDays, uDays, schedules);
	}

	public async searchServices(unitId: string, data: IViewDailyServicesRequest) {
		const group = await this.sharedService.getUserGroup(unitId);
		const startDate = new Date(data.start);
		const endDate = new Date(data.end);

		const { days } = intervalToDuration({
			start: startDate,
			end: endDate,
		});

		const keys = Array.from({ length: (days ?? 0) + 1 }, (_, k) => {
			const tmpDate = addDays(startDate, k);

			return format(tmpDate, "yyyy-MM-dd");
		});

		const services = await ScheduleServiceType.query()
			// .has('schedules', '>', 0)
			.where("active", true)
			.where("economic_group_id", group.id)
			.preload("schedules", (query) => {
				query.whereBetween("start_hour", [startDate, endDate]);

				query.preload("patient");
				query.preload("race");
				query.preload("holder");
				query.preload("user");
			});

		return keys.map((key) => ({
			[key]: services.map((service) => ({
				[service.description]: service.schedules
					.filter((schedule) => {
						const scheduleDate = schedule.startHour.toJSDate();

						const keyDate = DateTime.fromFormat(key, "yyyy-MM-dd").toJSDate();

						return isSameDay(scheduleDate, keyDate);
					})
					.map((schedule) => ({
						id: schedule.id,
						startHour: schedule.startHour,
						endHour: schedule.endHour,
						age: schedule.age,
						majorComplaint: schedule.majorComplaint,
						holder: {
							id: schedule.holder?.id,
							name: schedule.holder?.name,
						},
						patient: {
							id: schedule.patient.id,
							name: schedule.patient.name,
						},
						race: {
							id: schedule.race?.id,
							description: schedule.race?.description,
						},
						user: {
							id: schedule.user.id,
							name: schedule.user.name,
						},
					})),
			})),
		}));
	}

	private mapSchedulesToDays(
		keys: string[],
		wDays: WorkingDay[],
		uDays: UnavailableDay[],
		schedules: Schedule[],
	) {
		return keys.map((k) => {
			const filteredWorkingDays = wDays.filter((day) =>
				ScheduleService.dayOfWeekMatches(new Date(k), [day.weekDay]),
			);

			const filteredUnavailableDays = uDays.filter((day) =>
				ScheduleService.dayOfWeekMatches(new Date(k), day.frequency),
			);

			const filteredSchedules = schedules.filter(
				(day) => k === format(day.startHour.toJSDate(), "yyyy-MM-dd"),
			);

			const users = [
				filteredUnavailableDays.map((s) => s.user),
				filteredWorkingDays.map((s) => s.user),
				filteredSchedules.map((s) => s.user),
			].flat();
			const uniqueIds = Array.from(new Set(users.map((u) => u.id)));
			const uniqueUsers = uniqueIds.map(
				(id) => users.find((u) => u.id === id)!,
			);

			const allEvents = [
				...filteredWorkingDays,
				...filteredUnavailableDays,
				...filteredSchedules,
			];

			return {
				date: k,
				users: uniqueUsers.map((u) => ({
					id: u.id,
					name: u.name,
					events: allEvents
						.filter((e) => e.user.id === u.id)
						.map((day) => ({
							start: day.startHour.toString(),
							end: day.endHour.toString(),
							type: this.getEventLabel(day),
							event: day,
						})),
				})),
			};
		});
	}

	public async userDailySchedule(
		authCtx: AuthContext,
		data: {
			user?: string;
			to?: string;
			from?: string;
			lista_cancelados?: string;
			status?: string[];
			working?: string;
			unavailable?: string;
			patient?: string;
		},
	) {
		// if (!data.from || !data.to) {
		// 	throw new BadRequestException("Data não informada", 400, "E_BAD_REQUEST");
		// }
		const refStart = data.from ? new Date(data.from) : new Date();
		const refEnd = data.to ? new Date(data.to) : new Date();

		const usersQb = Database.from("users")
			.select(Database.raw("distinct users.id, users.name, users.on_duty"))
			.joinRaw(
				"join user_unit_roles on users.id = user_unit_roles.user_id and user_unit_roles.active is true",
			)
			.joinRaw(
				`left join working_days
                   on user_unit_roles.unit_id = working_days.business_unit_id and working_days.user_id = users.id and working_days.weekday_index = ?`,
				[refStart.getDay().toString()],
			)
			.joinRaw(
				"left join schedules on schedules.user_id = users.id and schedules.start_hour::date between ? and ?",
				[refStart, refEnd],
			)
			.where("user_unit_roles.unit_id", authCtx.unit.id)
			.where("users.type", "user")
			.whereRaw(
				"((users.on_duty = true) or (working_days.id is not null) or (schedules.id is not null))",
			);

		if (data.user) {
			usersQb.where("users.id", data.user);
		}

		if (!authCtx.hasPermission("AGE10")) {
			usersQb.where("users.id", authCtx.user.id);
		}

		const users = await usersQb;
		const userIds = Array.from(new Set(users.map((u) => u.id)));

		const days = Math.max(differenceInDays(refStart, refEnd), 1);
		const diffDays = Array.from({ length: days }, (_, k) => {
			const tmpDate = addDays(refStart, k);
			return ScheduleService.GetWD(tmpDate);
		});
		const resultData: [
			{
				id: string;
				user_id: string;
				start_hour: string;
				end_hour: string;
				service_type: {
					id: string;
					description: string;
					type: string;
				};
				service_status: {
					id: string;
					description: string;
					color: string;
					type: string;
				};
				reason: {
					id: string;
					description: string;
				} | null;
				attendaces: {
					id: number;
					scheduleService: {
						id: string;
						description: string;
					};
				}[];
				patient: {
					id: string;
					name: string;
					tutor: { cellphone: string | null; telephone: string | null };
				} | null;
			}[],
			WorkingDay[],
			UnavailableDay[],
		] = [[], [], []];

		const schedulesQb = Database.from("schedules")
			.select(
				Database.raw(`schedules.id,
       schedules.user_id,
       schedules.start_hour,
       schedules.end_hour,
       json_build_object('id', sst.id, 'description', sst.description, 'type', sst.type) as service_type,
       json_build_object('id', ss.id, 'description', ss.description, 'color', ss.color, 'type',
                         ss.type)                                                        as service_status,
       case
           when schedules.reason_id is not null then
               json_build_object('id', ss.id, 'description', ss.description, 'color', ss.color, 'type',
                                 ss.type)
           end                                                                           as reason,
       coalesce(json_agg(json_build_array(json_build_object('id', at.id, 'scheduleService',
                                                            json_build_object('id', ssat.id, 'description', ssat.description))
                         )) filter (where at.id is not null), '[]'::json)                as attendances,
       case
           when p.id is null then
               null
           else
               json_build_object('id', p.id, 'name', p.name, 'photo', p.photo, 'tag', p.tag, 'cellphone',
                                 pt.cellphone)
           end
                                                                                         as patient,
       case
           when p.type = 'animal' then
               json_build_object('id', rc.id, 'description', rc.description) end         as race,
       case
           when p.type = 'animal' then
               json_build_object('id', sp.id, 'description', sp.description) end         as specie`),
			)
			.joinRaw(
				"join schedule_service_types sst on schedules.schedule_service_type_id = sst.id",
			)
			.joinRaw(
				"join schedule_statuses ss on schedules.schedule_status_id = ss.id",
			)
			.joinRaw("left join reasons r on schedules.reason_id = r.id")
			.joinRaw("left join attendances at on schedules.id = at.schedule_id")
			.joinRaw(
				"left join schedule_service_types ssat on at.schedule_service_id = ssat.id",
			)
			.groupByRaw("schedules.id, sst.id, ss.id, p.id, pt.id, rc.id, sp.id")
			.where("schedules.business_unit_id", authCtx.unit.id)
			.whereRaw("schedules.start_hour::date between ? and ?", [
				refStart,
				refEnd,
			])
			.whereIn("schedules.user_id", userIds);

		if (data.status) {
			schedulesQb.whereRaw("ss.type = ?", [data.status]);
		}

		if (data.lista_cancelados?.toLowerCase() === "false") {
			schedulesQb.whereRaw("ss.type <> 'CANC'", []);
		}

		if (authCtx.unit.unitConfig?.requiresScheduleTutor) {
			schedulesQb.joinRaw("left join patients p on schedules.holder_id = p.id");
		} else {
			schedulesQb.joinRaw(
				"left join patients p on schedules.patient_id = p.id",
			);
		}

		schedulesQb
			.joinRaw("left join patient_tutors pt on p.id = pt.patient_id")
			.joinRaw("left join patient_animals pa on p.id = pa.patient_id")
			.joinRaw("left join races rc on pa.race_id = rc.id")
			.joinRaw("left join species sp on rc.specie_id = sp.id");

		resultData[0] = await schedulesQb;

		if (typeof data.working === "undefined" || data.working === "true") {
			resultData[1] = await WorkingDay.query()
				.select("id", "day_of_week", "user_id", "start_hour", "end_hour")
				.where("business_unit_id", authCtx.unit.id)
				.whereIn("day_of_week", Array.from(new Set(diffDays))) // add all days
				.whereIn("user_id", userIds);
		}

		if (
			typeof data.unavailable === "undefined" ||
			data.unavailable === "true"
		) {
			resultData[2] = await UnavailableDay.query()
				.select(
					"id",
					"user_id",
					"start_hour",
					"end_hour",
					"frequency",
					"start_date",
					"end_date",
					"active",
					"title",
				)
				.where("active", true)
				.where("business_unit_id", authCtx.unit.id)
				.whereILike("frequency", `%${ScheduleService.GetWD(refStart)}%`)
				.whereRaw("(start_date::date <= ? or start_date::date is null)", [
					data.from ?? new Date(),
				])
				.whereRaw("(end_date::date >= ? or end_date::date is null)", [
					data.to ?? new Date(),
				])
				.whereIn("user_id", userIds);
		}

		// const executions: {
		// 	tipo_registro: string;
		// 	description: string;
		// 	label: string;
		// 	reserved_minutes: number;
		// 	treatment_id: number;
		// 	treatment_item_id: number;
		// 	treatment_execution_id: number;
		// 	schedule_id: string;
		// }[] = await Database.from("treatment_executions")
		// 	.select(
		// 		Database.raw(
		// 			`
		//               'Tratamento'                                             as tipo_registro,
		//      'Tratamentos - Execuções'                                as description,
		//      products.description || ' - ' || productivity_items.description as label,
		//      productivity_items.reserved_minutes,
		//      treatment_executions.treatment_id                        as treatment_id,
		//      treatment_executions.treatment_item_id                   as treatment_item_id,
		//      treatment_executions.id                                  as treatment_execution_id,
		//      treatment_executions.schedule_id
		//      `,
		// 			[],
		// 		),
		// 	)
		// 	.joinRaw(
		// 		"join productivity_items on treatment_executions.productivity_item_id = productivity_items.id",
		// 	)
		// 	.joinRaw(
		// 		`join (treatment_items join product_variations on product_variations.id = treatment_items.product_variation_id join products
		//              on product_variations.product_id = products.id)
		//             on treatment_executions.treatment_item_id = treatment_items.id and
		//                treatment_executions.treatment_id = treatment_items.treatment_id`,
		// 	)
		// 	.joinRaw(
		// 		"join treatments on treatment_executions.treatment_id = treatments.id",
		// 	)
		// 	.where("treatments.client_id", data.patient ?? v4())
		// 	.where("treatments.economic_group_id", authCtx.group.id)
		// 	.where("treatments.business_unit_id", authCtx.unit.id)
		// 	.whereNotNull("treatment_executions.schedule_id")
		// 	.orderByRaw("1, 4, 3, 7");

		const allEvents = [
			...resultData[1],
			...resultData[2],
			...resultData[0].map((v) => this.snakeToCamelDeep(v)),
		];

		return users
			.map((elem) => {
				return {
					id: elem.id,
					name: elem.name,
					onDuty: elem.on_duty,
					events: allEvents
						.filter((e) =>
							//@ts-ignore
							"userId" in e ? e.userId === elem.id : e.user_id === elem.id,
						)
						.map((day) => ({
							start:
								"start_hour" in day ? day.start_hour : day.startHour.toString(),
							end: "end_hour" in day ? day.end_hour : day.endHour.toString(),
							event: day,
							name: elem.name,
							type: this.getEventLabel(day),
						})),
				};
			})
			.filter((f) => (f.onDuty ? true : f.events.length > 0));
	}

	public async simpleUserDailySchedule(
		authCtx: AuthContext,
		data: {
			user?: string;
			to?: string;
			from?: string;
			lista_cancelados?: string;
		},
	) {
		if (!data.from || !data.to) {
			throw new BadRequestException("Data não informada", 400, "E_BAD_REQUEST");
		}

		const usersQb = Database.from("users")
			.select(Database.raw(`distinct users.id, users.name, users.on_duty`))
			.joinRaw(
				`join user_unit_roles on users.id = user_unit_roles.user_id and user_unit_roles.active is true`,
			)
			.joinRaw(
				`left join working_days
                   on user_unit_roles.unit_id = working_days.business_unit_id and working_days.user_id = users.id and working_days.weekday_index = ?`,
				[new Date(data.from).getDay().toString()],
			)
			.joinRaw(
				`left join schedules on schedules.user_id = users.id and schedules.start_hour::date between ? and ?`,
				[data.from, data.to],
			)
			.where("user_unit_roles.unit_id", authCtx.unit.id)
			.where("users.type", "user")
			.whereRaw(
				`((users.on_duty = true) or (working_days.id is not null) or (schedules.id is not null))`,
			);

		const hasPermission = await this.sharedService.userHasPermission(
			authCtx,
			"AGE10",
		);
		if (!hasPermission) {
			usersQb.where("users.id", authCtx.user.id);
		}

		if (data.user) {
			usersQb.where("users.id", data.user);
		}

		const users = await usersQb;
		const userIds = Array.from(new Set(users.map((u) => u.id)));

		const schedulesQb = Schedule.query()
			.where("business_unit_id", authCtx.unit.id)
			.whereRaw("start_hour::date between ? and ?", [data.from, data.to])
			.whereIn("user_id", userIds)
			.preload("serviceType", (query) => {
				query.select(["id", "description", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.preload("holder", (query) => {
				query.select(["id", "name"]);
				query.preload("tutor", (query) => {
					query.select(["cellphone", "telephone"]);
				});
			})
			.preload("reason", (query) => {
				query.select(["id", "reason"]);
			})
			.preload("attendances", (query) => {
				query.select("id", "schedule_service_id");

				query.preload("scheduleService", (query) => {
					query.select("id", "description");
				});
			})
			.orderBy("start_hour", "asc");

		if (data.lista_cancelados?.toLowerCase() === "false") {
			schedulesQb.whereHas("serviceStatus", (query) => {
				query.whereNot("type", "CANC");
			});
		}

		const schedules = await schedulesQb;

		const patients = await Patient.query()
			.whereIn(
				"id",
				schedules.map((s) => s.patient_id).filter(Boolean) as string[],
			)
			.preload("tutor");

		const mappedSchedules = schedules.map((schedule) => {
			const jsonKinda = schedule.toJSON();
			const patient = patients.find((p) => p.id === schedule.patient_id);

			jsonKinda.user_id = schedule.user_id;
			// jsonKinda.startHour = DateTime.fromISO(jsonKinda.start_hour).setZone(
			//   'America/Fortaleza',
			// );
			// jsonKinda.endHour = DateTime.fromISO(jsonKinda.end_hour).setZone(
			//   'America/Fortaleza',
			// );
			jsonKinda.startHour = DateTime.fromISO(jsonKinda.start_hour);
			jsonKinda.endHour = DateTime.fromISO(jsonKinda.end_hour);
			jsonKinda.start_hour = undefined;
			jsonKinda.end_hour = undefined;
			jsonKinda.start = undefined;
			jsonKinda.end = undefined;
			jsonKinda.created_at = undefined;
			jsonKinda.updated_at = undefined;

			jsonKinda.patient = {
				id: patient?.id,
				name: patient?.name,
				photo: patient?.photo,
				tag: patient?.tag,
				cellphone: patient?.tutor?.cellphone ?? null,
			};

			return jsonKinda;
		});

		return users
			.map((elem) => {
				return {
					id: elem.id,
					name: elem.name,
					onDuty: elem.on_duty,
					events: mappedSchedules
						.filter((e) => e.user_id === elem.id)
						.map((day) => ({
							start: day.startHour.toString(),
							end: day.endHour.toString(),
							event: day,
							type: this.getEventLabel(day),
						})),
				};
			})
			.filter((f) => (f.onDuty ? true : f.events.length > 0));
	}

	public async usersWeeklySchedule(
		authCtx: AuthContext,
		data: {
			users?: string[];
			to?: string;
			from?: string;
			lista_cancelados?: string;
		},
	) {
		if (!data.from || !data.to) {
			throw new BadRequestException("Data não informada", 400, "E_BAD_REQUEST");
		}

		if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
			throw new BadRequestException(
				"Usuários não informados",
				400,
				"E_BAD_REQUEST",
			);
		}

		const usersQb = Database.from("users")
			.select(Database.raw(`distinct users.id, users.name, users.on_duty`))
			.joinRaw(
				`join user_unit_roles on users.id = user_unit_roles.user_id and user_unit_roles.active is true`,
			)
			.joinRaw(
				`left join working_days
                   on user_unit_roles.unit_id = working_days.business_unit_id and working_days.user_id = users.id and working_days.weekday_index = ?`,
				[new Date(data.from).getDay().toString()],
			)
			.joinRaw(
				`left join schedules on schedules.user_id = users.id and schedules.start_hour::date between ? and ?`,
				[data.from, data.to],
			)
			.where("user_unit_roles.unit_id", authCtx.unit.id)
			.where("users.type", "user")
			.whereRaw(
				`((users.on_duty = true) or (working_days.id is not null) or (schedules.id is not null))`,
			)
			.whereIn("users.id", data.users);
		const hasPermission = await this.sharedService.userHasPermission(
			authCtx,
			"AGE10",
		);
		if (!hasPermission) {
			usersQb.where("users.id", authCtx.user.id);
		}
		const users = await usersQb;

		const userIds = Array.from(new Set(users.map((u) => u.id)));

		const days: string[] = [];
		const diff = differenceInDays(new Date(data.to), new Date(data.from));
		const start = DateTime.fromISO(data.from);

		for (let i = 0; i <= diff; i++) {
			const dt = start.plus({ days: i });
			days.push(dt.toFormat("dd/MM/yyyy"));
		}

		const schedulesQb = Schedule.query()
			.where("business_unit_id", authCtx.unit.id)
			.whereRaw("start_hour::date between ? and ?", [data.from, data.to])
			.whereIn("user_id", userIds)
			.preload("serviceType", (query) => {
				query.select(["id", "description", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.preload("reason", (query) => {
				query.select(["id", "reason"]);
			})
			.preload("attendances", (query) => {
				query.select("id", "schedule_service_id");

				query.preload("scheduleService", (query) => {
					query.select("id", "description");
				});
			})
			.preload("holder", (query) => {
				query.select(["id", "name"]);
				query.preload("tutor", (query) => {
					query.select(["cellphone", "telephone"]);
				});
			});

		if (data.lista_cancelados?.toLowerCase() === "false") {
			schedulesQb.whereHas("serviceStatus", (query) => {
				query.whereNot("type", "CANC");
			});
		}

		const schedules = await schedulesQb;

		const patients = await Patient.query()
			.whereIn(
				"id",
				schedules.map((s) => s.patient_id).filter(Boolean) as string[],
			)
			.preload("tutor");

		const mappedSchedules = schedules.map((schedule) => {
			const jsonKinda = schedule.toJSON();
			const patient = patients.find((p) => p.id === schedule.patient_id);

			jsonKinda.user_id = schedule.user_id;
			// jsonKinda.startHour = DateTime.fromISO(jsonKinda.start_hour).setZone(
			//   'America/Fortaleza',
			// );
			// jsonKinda.endHour = DateTime.fromISO(jsonKinda.end_hour).setZone(
			//   'America/Fortaleza',
			// );
			jsonKinda.startHour = DateTime.fromISO(jsonKinda.start_hour);
			jsonKinda.endHour = DateTime.fromISO(jsonKinda.end_hour);
			jsonKinda.start_hour = undefined;
			jsonKinda.end_hour = undefined;
			jsonKinda.start = undefined;
			jsonKinda.end = undefined;
			jsonKinda.created_at = undefined;
			jsonKinda.updated_at = undefined;

			jsonKinda.patient = {
				id: patient?.id,
				name: patient?.name,
				photo: patient?.photo,
				tag: patient?.tag,
				cellphone: patient?.tutor?.cellphone ?? null,
			};

			return jsonKinda;
		});

		return days.map((elem) => {
			const daySchedules = mappedSchedules.filter((e) =>
				isSameDay(
					e.startHour.toJSDate(),
					DateTime.fromFormat(elem, "dd/MM/yyyy").toJSDate(),
				),
			);

			const map: Map<User, ModelObject[]> = new Map();
			for (const user of users) {
				map.set(
					user,
					daySchedules.filter((e) => e.user_id === user.id),
				);
			}

			return {
				day: elem,
				events: users.map((inner) => {
					return {
						user: {
							id: inner.id,
							name: inner.name,
							onDuty: inner.on_duty,
						},
						events: map.get(inner)?.map((e) => ({
							type: this.getEventLabel(e),
							start: e.startHour.toString(),
							end: e.endHour.toString(),
							event: e,
						})),
					};
				}),
			};
		});
	}

	public async userAppointments(unitId: string, uid: string, day: Date) {
		const group = await this.sharedService.getUserGroup(unitId);
		const user = await group
			.related("users")
			.query()
			.where("user_id", uid)
			.firstOrFail();

		return user
			.related("schedules")
			.query()
			.whereBetween("start_hour", [startOfDay(day), endOfDay(day)])
			.preload("patient")
			.preload("serviceType")
			.preload("serviceStatus")
			.preload("holder")
			.preload("race");
	}

	private getEventLabel(
		data: WorkingDay | UnavailableDay | Schedule | unknown,
	) {
		if (data instanceof WorkingDay) {
			return "working";
		}

		if (data instanceof UnavailableDay) {
			return "unavailable";
		}

		// @ts-ignore
		if ("tipo_registro" in data) {
			return "treatment";
		}

		return "schedule";
	}

	async getGeneralSchedules(
		unit: string,
		start: Date,
		end: Date,
	): Promise<[WorkingDay[], UnavailableDay[], Schedule[]]> {
		const workingDays = await WorkingDay.query()
			.where("business_unit_id", unit)
			.andWhereBetween("start_hour", [
				format(start, "HH:mm"),
				format(end, "HH:mm"),
			])
			.preload("user");

		const unavailableDays = await UnavailableDay.query()
			.where("active", true)
			.where("business_unit_id", unit)
			.andWhereRaw("(start_date < ? or start_date is null)", [start])
			.andWhereRaw("(end_date > ? or end_date is null)", [end])
			.preload("user");

		const schedules = await Schedule.query()
			.where("business_unit_id", unit)
			.andWhereBetween("start_hour", [start, end])
			.preload("serviceType", (query) => {
				query.select(["id", "description", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.preload("patient", (query) => {
				query.select(["id", "name"]);
			})
			.preload("holder", (query) => {
				query.select(["id", "name"]);
				query.preload("tutor", (query) => {
					query.select(["cellphone", "telephone"]);
				});
			})
			.preload("user");

		return [workingDays, unavailableDays, schedules];
	}

	async getUserGeneralSchedules(
		user: string,
		unit: string,
		start: Date,
		end: Date,
	): Promise<[WorkingDay[], UnavailableDay[], Schedule[]]> {
		const workingDays = await WorkingDay.query()
			.where("business_unit_id", unit)
			.andWhere("user_id", user)
			.andWhere("day_of_week", ScheduleService.GetWD(start))
			.preload("user");

		const unavailableDays = await UnavailableDay.query()
			.where("active", true)
			.where("business_unit_id", unit)
			.andWhere("user_id", user)
			.andWhereRaw("(start_date < ? or start_date is null)", [start])
			.andWhereRaw("(end_date > ? or end_date is null)", [end])
			.andWhereILike("frequency", `%${ScheduleService.GetWD(start)}%`)
			.preload("user");

		const schedules = await Schedule.query()
			.where("business_unit_id", unit)
			.andWhere("user_id", user)
			.andWhereBetween("start_hour", [start, end])
			.preload("serviceType", (query) => {
				query.select(["id", "description", "type"]);
			})
			.preload("serviceStatus", (query) => {
				query.select(["id", "description", "color", "type"]);
			})
			.preload("patient", (query) => {
				query.select(["id", "name"]);
			})
			.preload("user");

		return [workingDays, unavailableDays, schedules];
	}

	private static async checkDisponibility(
		user: string,
		unitId: string,
		data: DateSet,
	) {
		const scheduleUser = await User.findOrFail(user);

		const workingDays = await WorkingDay.query()
			.where("user_id", scheduleUser.id)
			.where("business_unit_id", unitId)
			.andWhere("day_of_week", ScheduleService.GetWD(data.start))
			.andWhereRaw("(start_hour <= ? or start_hour is null)", [
				format(data.start, "HH:mm"),
			])
			.andWhereRaw("(end_hour >= ? or end_hour is null)", [
				format(data.end, "HH:mm"),
			]);

		// if (workingDays.length === 0) {
		//   throw new BadRequestException(
		//     'Pessoa não trabalha neste horário',
		//     400,
		//     'WORKING_DAY',
		//   );
		// }

		const strStart = format(data.start, "HH:mm");
		const strEnd = format(data.end, "HH:mm");

		const unavailableDays = await scheduleUser
			.related("unavailableDays")
			.query()
			.where("active", true)
			.where("business_unit_id", unitId)
			.whereILike("frequency", `%${ScheduleService.GetWD(data.start)}%`)
			.whereRaw("(start_date <= ? or start_date is null)", [data.start])
			.whereRaw("(end_date >= ? or end_date is null)", [data.end])
			.whereRaw(
				`((? between start_hour and end_hour or ? between start_hour and end_hour) or (? > end_hour and ? < start_hour))`,
				[strStart, strEnd, strEnd, strStart],
			);

		// if (unavailableDays.length !== 0) {
		//   throw new BadRequestException(
		//     'Pessoa não está disponível neste horário',
		//     400,
		//     'UNAVAILABLE_DAY',
		//   );
		// }

		return {
			invalidWorkingDay: workingDays.length === 0,
			invalidUnavailableDay: unavailableDays.length !== 0,
		};
	}

	private static dayOfWeekMatches(_date: Date, wd: Array<WeekDay>): boolean {
		return wd.includes(ScheduleService.GetWD(_date));
	}

	public static GetWD(date: Date) {
		return Object.values(WeekDay)[date.getDay()];
	}

	public async updateScheduleStatusWithStaticValues(
		authCtx: AuthContext,
		data: IUpdateScheduleStatus,
	) {
		return Database.transaction(async (trx) => {
			const schedule = await Schedule.query()
				.useTransaction(trx)
				.where("id", data.scheduleId)
				.where("business_unit_id", authCtx.unit.id)
				.preload("serviceStatus")
				.first();

			if (!schedule) {
				throw new ResourceNotFoundException(
					"Agendamento não encontrado",
					400,
					"E_ERR",
				);
			}

			if (schedule.schedule_status_id === data.scheduleId) {
				return schedule;
			}

			if (data.reasonId) {
				const reason = await Reason.findOrFail(data.reasonId);
				if (reason.requiresObservation && !data.observation) {
					throw new BadRequestException(
						"É preciso informar observação",
						400,
						"E_MISSING",
					);
				}
			}

			const toStatus = await ScheduleStatus.find(data.statusId, {
				client: trx,
			});
			if (!toStatus) {
				throw new ResourceNotFoundException(
					"Agendamento não encontrado",
					400,
					"E_ERR",
				);
			}

			const validChanges = VALID_CHANGES[schedule.serviceStatus.type];
			if (!validChanges || !validChanges.includes(toStatus.type)) {
				throw new BadRequestException("Mudança inválida", 400, "E_INVALID");
			}

			if (toStatus.type === "REC") {
				await this.opportunityService.updateOpportunityScheduleAsAttended(
					authCtx,
					schedule,
					trx,
				);
			}

			if (toStatus.type === "CANC") {
				await this.opportunityService.updateOpportunityScheduleAsUnchecked(
					authCtx,
					schedule,
					trx,
				);
			}

			await schedule.related("statusChanges").create(
				{
					user_id: authCtx.user.id,
					schedule_status_id: data.statusId,
					reason_id: data.reasonId,
					observation: data.observation,
				},
				{
					client: trx,
				},
			);

			await schedule
				.merge({
					schedule_status_id: data.statusId,
					finishedAt:
						toStatus.type === "FIN"
							? DateTime.now().minus({ hours: 3 })
							: schedule.finishedAt,
					reason_id: data.reasonId,
					observation: data.observation,
					cancellation_user_id:
						toStatus.type === "CANC"
							? authCtx.user.id
							: schedule.cancellation_user_id,
					startedAt:
						toStatus.type === "ATEND"
							? DateTime.now().minus({ hours: 3 })
							: schedule.startedAt,
				})
				.useTransaction(trx)
				.save();

			return schedule.refresh();
		});
	}

	public async updateScheduleStatusFromType(
		authCtx: AuthContext,
		data: {
			scheduleId: string;
			scheduleStatusType: string;

			reasonId?: string;
			observation?: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const schedule = await Schedule.query()
				.useTransaction(trx)
				.where("id", data.scheduleId)
				.where("business_unit_id", authCtx.unit.id)
				.preload("serviceStatus")
				.first();

			if (!schedule) {
				throw new ResourceNotFoundException(
					"Agendamento não encontrado",
					400,
					"E_ERR",
				);
			}

			if (data.reasonId) {
				const reason = await Reason.findOrFail(data.reasonId);
				if (reason.requiresObservation && !data.observation) {
					throw new BadRequestException(
						"É preciso informar observação",
						400,
						"E_MISSING",
					);
				}
			}

			const toStatus = await ScheduleStatus.query()
				.useTransaction(trx)
				.whereRaw("(system_id = ? or system_id is null)", [authCtx.system.id])
				.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
					authCtx.group.id,
				])
				.where("type", data.scheduleStatusType)
				.first();
			if (!toStatus) {
				throw new ResourceNotFoundException(
					"Status de agendamento não encontrado",
					400,
					"E_ERR",
				);
			}

			const validChanges = VALID_CHANGES[schedule.serviceStatus.type];
			if (!validChanges || !validChanges.includes(toStatus.type)) {
				throw new BadRequestException("Mudança inválida", 400, "E_INVALID");
			}

			if (toStatus.type === "REC") {
				await this.opportunityService.updateOpportunityScheduleAsAttended(
					authCtx,
					schedule,
					trx,
				);
			}

			if (toStatus.type === "CANC") {
				await this.opportunityService.updateOpportunityScheduleAsUnchecked(
					authCtx,
					schedule,
					trx,
				);
			}

			await schedule.related("statusChanges").create(
				{
					user_id: authCtx.user.id,
					schedule_status_id: toStatus.id,
					reason_id: data.reasonId,
					observation: data.observation,
				},
				{
					client: trx,
				},
			);

			return schedule
				.merge({
					schedule_status_id: toStatus.id,
					finishedAt:
						toStatus.type === "FIN"
							? DateTime.now().minus({ hours: 3 })
							: schedule.finishedAt,
					reason_id: data.reasonId,
					observation: data.observation,
					cancellation_user_id:
						toStatus.type === "CANC"
							? authCtx.user.id
							: schedule.cancellation_user_id,
					startedAt:
						toStatus.type === "ATEND"
							? DateTime.now().minus({ hours: 3 })
							: schedule.startedAt,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async getScheduleStatusChanges(authCtx: AuthContext, id: string) {
		return Database.transaction(async (trx) => {
			const schedule = await Schedule.query()
				.useTransaction(trx)
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.preload("statusChanges", (query) => {
					query.orderBy("created_at", "desc");

					query.preload("user", (query) => {
						query.select(["id", "name", "email"]);
					});
					query.preload("reason", (query) => {
						query.select(["id", "reason"]);
					});
				})
				.preload("reschedules", (query) => {
					query.orderBy("created_at", "desc");

					query.preload("user", (query) => {
						query.select(["id", "name", "email"]);
					});
					query.preload("reason", (query) => {
						query.select(["id", "reason"]);
					});
				})
				.first();

			if (!schedule) {
				throw new ResourceNotFoundException(
					"Agendamento não encontrado",
					400,
					"E_ERR",
				);
			}

			const reschedules = schedule.reschedules.map((r) => {
				return {
					id: r.id,
					observation: r.observation,
					reason: {
						id: r.reason?.id,
						reason: r.reason?.reason,
					},
					user: {
						id: r.user.id,
						name: r.user.name,
						email: r.user.email,
					},
					createdAt: r.createdAt,
				};
			});

			const statusChanges = schedule.statusChanges.map((r) => {
				return {
					id: r.id,
					observation: r.observation,
					reason: {
						id: r.reason?.id,
						reason: r.reason?.reason,
					},
					user: {
						id: r.user.id,
						name: r.user.name,
						email: r.user.email,
					},
					createdAt: r.createdAt,
				};
			});

			return {
				reschedules,
				statusChanges,
			};
		});
	}

	public async createScheduleContact(
		authCtx: AuthContext,
		data: IScheduleContactData,
	) {
		return Database.transaction(async (trx) => {
			const schedule = await Schedule.query()
				.useTransaction(trx)
				.where("id", data.scheduleId)
				.where("business_unit_id", authCtx.unit.id)
				.preload("serviceStatus")
				.first();

			if (!schedule) {
				throw new ResourceNotFoundException(
					"Agendamento não encontrado",
					400,
					"E_ERR",
				);
			}

			const toStatus = await ScheduleStatus.find(data.statusId, {
				client: trx,
			});
			if (!toStatus) {
				throw new ResourceNotFoundException(
					"Status não encontrado",
					400,
					"E_ERR",
				);
			}

			await schedule.related("contacts").create(
				{
					user_id: authCtx.user.id,
					schedule_status_id: data.statusId,
					observation: data.observation ?? "",
					contactDate: data.contactDate,
				},
				{
					client: trx,
				},
			);

			return schedule
				.merge({
					schedule_status_id: data.statusId,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async getPatientSchedules(authCtx: AuthContext, id: string) {
		const patient = await Patient.query().where("id", id).first();

		if (!patient) {
			throw this.sharedService.ResourceNotFound();
		}

		const schedules = await Schedule.query()
			.where("patient_id", id)
			.where("business_unit_id", authCtx.unit.id)
			.preload("holder")
			.preload("serviceType")
			.preload("user")
			.preload("serviceStatus")
			.preload("reschedules", (query) => {
				query.preload("user");
				query.preload("reason");
			})
			.preload("cancellationUser")
			.preload("reason")
			.orderBy("start_hour", "desc");

		return schedules.map((elem) => ({
			id: elem.id,
			start: elem.startHour,
			end: elem.endHour,
			majorComplaint: elem.majorComplaint,
			tutor: {
				id: elem.holder?.id,
				name: elem.holder?.name,
			},
			service: {
				id: elem.serviceType?.id,
				description: elem.serviceType?.description,
			},
			technician: {
				id: elem.user?.id,
				name: elem.user?.name,
			},
			status: {
				id: elem.serviceStatus?.id ?? null,
				description: elem.serviceStatus?.description ?? null,
				color: elem.serviceStatus.color ?? null,
			},
			cancellation: elem.cancellationUser
				? {
						technician: {
							id: elem.user?.id,
							name: elem.user?.name,
						},
						reason: elem.reason?.reason ?? null,
						observation: elem.observation,
						cancelledAt: elem.updatedAt,
					}
				: null,
			reschedules: elem.reschedules.map((r) => ({
				id: r.id,
				reason: r.reason?.reason,
				observation: r.observation,
				originalDate: r.originalDate,
				createdAt: r.createdAt,
				technician: {
					id: r.user?.id,
					name: r.user?.name,
				},
			})),
		}));
	}

	static async RunSyncLateOrMissingSchedules() {
		return await Database.transaction(async (trx) => {
			const scheduleStatuses = await ScheduleStatus.query().useTransaction(trx);

			const crmStatuses = await CrmStatus.query().useTransaction(trx);

			const missed: string[] = [];
			const late: string[] = [];

			const toBeMissedSchedules: {
				id: string;
				business_unit_id: string;
				system_id: number;
			}[] = await Database.from("schedules")
				.useTransaction(trx)
				.select(
					"schedules.id",
					"schedules.business_unit_id",
					"schedule_statuses.system_id",
				)
				.join(
					"schedule_statuses",
					"schedules.schedule_status_id",
					"schedule_statuses.id",
				)
				.join(
					"business_units",
					"schedules.business_unit_id",
					"business_units.id",
				)
				.join(
					"business_unit_configs",
					"business_units.id",
					"business_unit_configs.business_unit_id",
				)
				.whereNull("schedules.deleted_at")
				.whereRaw(
					"extract(epoch from (now() - interval '3 hours') - schedules.start_hour) / 60 > business_unit_configs.schedule_missed_minutes",
				)
				.whereRaw("schedule_statuses.type in ('AC', 'AN', 'ATR')")
				.whereRaw("business_unit_configs.schedule_missed_minutes > 0")
				.exec();

			if (toBeMissedSchedules.length > 0) {
				const tasks = toBeMissedSchedules.map(async (elem) => {
					const newStatus = scheduleStatuses.find(
						(s) => s.system_id === elem.system_id && s.type === "FAL",
					);

					if (!newStatus) {
						return Promise.resolve(null);
					}

					missed.push(elem.id);
					await Schedule.query()
						.useTransaction(trx)
						.where("id", elem.id)
						.update({
							schedule_status_id: newStatus.id,
						});

					const updatedOpportunityStatus = crmStatuses.find(
						(cs) =>
							cs.system_id === elem.system_id &&
							cs.type === "OP" &&
							cs.tag === "F",
					);
					if (updatedOpportunityStatus) {
						await Opportunity.query()
							.useTransaction(trx)
							.where("schedule_id", elem.id)
							.update({
								status_id: updatedOpportunityStatus.id,
							});
					}
				});

				await Promise.all(tasks);
			}

			const lateSchedules: {
				id: string;
				business_unit_id: string;
				system_id: number;
			}[] = await Database.from("schedules")
				.useTransaction(trx)
				.select(
					"schedules.id",
					"schedules.business_unit_id",
					"schedule_statuses.system_id",
				)
				.join(
					"schedule_statuses",
					"schedules.schedule_status_id",
					"schedule_statuses.id",
				)
				.join(
					"business_units",
					"schedules.business_unit_id",
					"business_units.id",
				)
				.join(
					"business_unit_configs",
					"business_units.id",
					"business_unit_configs.business_unit_id",
				)
				.whereNull("schedules.deleted_at")
				.whereRaw(
					"extract(epoch from (now() - interval '3 hours') - schedules.start_hour) / 60 > business_unit_configs.schedule_late_minutes",
				)
				.whereRaw("schedule_statuses.type in ('AC', 'AN')")
				.whereRaw("business_unit_configs.schedule_late_minutes > 0")
				.exec();

			if (lateSchedules.length > 0) {
				const tasks = lateSchedules.map(async (elem) => {
					const newStatus = scheduleStatuses.find(
						(s) => s.system_id === elem.system_id && s.type === "ATR",
					);

					if (!newStatus) {
						return Promise.resolve(null);
					}

					late.push(elem.id);
					return Schedule.query()

						.useTransaction(trx)
						.where("id", elem.id)
						.update({
							schedule_status_id: newStatus.id,
						});
				});

				await Promise.all(tasks);
			}

			return {
				missed,
				late,
			};
		});
	}

	private snakeToCamelDeep<T extends object>(
		obj: T,
	): {
		[K in keyof T]: T[K] extends object ? { [k in keyof T[K]]: string } : T[K];
	} {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => {
				const newKey = key.replace(/_([a-z])/g, (_, letter) =>
					letter.toUpperCase(),
				);
				return [
					newKey,
					value && typeof value === "object"
						? this.snakeToCamelDeep(value as object)
						: value,
				];
			}),
		) as {
			[K in keyof T]: T[K] extends object
				? { [k in keyof T[K]]: string }
				: T[K];
		};
	}
}
