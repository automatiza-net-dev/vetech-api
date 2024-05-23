import { inject } from "@adonisjs/fold";
import Database, {
	QueryClientContract,
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import CrmStatus from "App/Models/CrmStatus";
import Opportunity from "App/Models/Opportunity";
import OpportunityActivity, {
	TOpportunityActivityStatus,
} from "App/Models/OpportunityActivity";
import OpportunityActivityLog from "App/Models/OpportunityActivityLog";
import OpportunityLog from "App/Models/OpportunityLog";
import Patient, { PatientGender, PatientType } from "App/Models/Patient";
import Schedule from "App/Models/Schedule";
import { ScheduleStatusType } from "App/Models/ScheduleStatus";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";

@inject()
export default class OpportunityService {
	constructor(private sharedService: SharedService) {}

	public async showOpportunity(authCtx: AuthContext, id: string) {
		const result = await Opportunity.query()
			.where("economic_group_id", authCtx.group.id)
			.where("id", id)
			.preload("client", (query) => {
				query.preload("tutor");
				query.preload("patientAnimal", (query) => {
					query.select(
						"race_id",
						"death",
						"death_date",
						"microchip",
						"castrated",
					);

					query.preload("race", (query) => {
						query.select("id", "description", "specie_id");

						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});
			})
			.preload("race", (query) => {
				query.select("id", "description", "specie_id");

				query.preload("specie", (query) => {
					query.select("id", "description");
				});
			})
			.preload("closingUser")
			.preload("contact", (query) => {
				query.preload("tutor");
			})
			.preload("contactType")
			.preload("contactSubject")
			.preload("clientOrigin")
			.preload("status")
			.preload("user")
			.preload("unit")
			.preload("reason")
			.preload("activities", (query) => {
				query.preload("openingUser");
				query.preload("executionUser");
				query.preload("activity");
			})
			.first();

		if (!result) {
			throw this.sharedService.ResourceNotFound();
		}

		return {
			id: result.id,
			openingDate: result.openingDate,
			clientOriginItemDescription: result.clientOriginItemDescription,
			contactDate: result.contactDate,
			value: result.value,
			description: result.description,
			observation: result.observation,
			balance: result.balance,
			closingDate: result.closingDate,
			profitValue: result.profitValue,
			resultObservation: result.resultObservation,
			weight: result.weight,
			castrated: result.castrated,
			gender: result.gender,
			active: result.active,

			status: result.status,
			contact: result.contact,
			contactType: result.contactType,
			contactSubject: result.contactSubject,
			client: result.client,
			clientOrigin: result.clientOrigin,
			race: result.race,

			user: {
				id: result.user.id,
				name: result.user.name,
			},
			closingUser: this.sharedService.captureGroup(result.closingUser, (v) => ({
				id: v.id,
				name: v.name,
			})),
			unit: {
				id: result.unit.id,
				companyName: result.unit.companyName,
				fantasyName: result.unit.fantasyName,
			},
			reason: this.sharedService.captureGroup(result.reason, (v) => ({
				id: v.id,
				reason: v.reason,
			})),
			schedule: {
				id: result.schedule_id ?? null,
			},
			activities: result.activities,
		};
	}

	public async searchOpportunities(
		authCtx: AuthContext,
		data: {
			openingFrom?: string;
			openingTo?: string;
			contactFrom?: string;
			contactTo?: string;
			contactName?: string;
			contactPhone?: string;
			patientName?: string;
			technician?: string;
			// minWeight?: string;
			// maxWeight?: string;
			// specie?: string;
			// race?: string;
			// gender?: string;
			// castrated?: string;
			clientName?: string;
			unit?: string[];
			status?: string[];
			balance?: string[];
		},
	) {
		const qb = Opportunity.query()
			.where("economic_group_id", authCtx.group.id)
			.preload("client", (query) => {
				query.select("id", "name", "weight", "gender");

				query.preload("tutor");

				query.preload("patientAnimal", (query) => {
					query.select("id", "castrated", "race_id");
					query.preload("race", (query) => {
						query.select("id", "description", "specie_id");
						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});
			})
			.preload("contact", (query) => {
				query.preload("tutor", (query) => {
					query.select("id", "email", "cellphone", "telephone");
				});
			})
			.preload("contactType")
			.preload("contactSubject")
			.preload("status")
			.preload("user")
			.preload("unit")
			.preload("reason")
			.preload("clientOrigin");

		if (data.clientName) {
			qb.whereHas("client", (query) => {
				query
					.whereRaw("name ~* ?", [
						`(${data.clientName?.toLowerCase().split(" ").join("|")})`,
					])
					.where("type", PatientType.ANIMAL);
			});
		}

		if (data.unit && Array.isArray(data.unit)) {
			qb.whereIn("business_unit_id", data.unit);
		}

		if (data.technician) {
			qb.where("user_id", data.technician);
		}

		if (data.openingFrom) {
			qb.whereRaw("opening_date::date >= ?", [data.openingFrom]);
		}

		if (data.openingTo) {
			qb.whereRaw("opening_date::date <= ?", [data.openingTo]);
		}

		if (data.contactFrom) {
			qb.whereRaw("contact_date::date >= ?", [data.contactFrom]);
		}

		if (data.contactTo) {
			qb.whereRaw("contact_date::date <= ?", [data.contactTo]);
		}

		if (data.status && Array.isArray(data.status)) {
			qb.whereIn("status_id", data.status);
		}

		if (data.balance && Array.isArray(data.balance)) {
			const hasEmAberto = data.balance.includes("Em Aberto");
			const cleanOptions = data.balance.filter((v) => v !== "Em Aberto");
			const sanitizedOptions = data.balance.filter((f) =>
				["Ganho", "Perda"].includes(f),
			);

			if (hasEmAberto && sanitizedOptions.length > 0) {
				qb.whereRaw(
					`(balance = ANY('{${sanitizedOptions.join(
						",",
					)}}') or closing_date is null)`,
					[],
				);
			}

			if (hasEmAberto && cleanOptions.length === 0) {
				qb.whereNull("closing_date");
			}

			if (!hasEmAberto && cleanOptions.length > 0) {
				qb.whereIn("balance", cleanOptions);
			}
		}

		if (data.contactName || data.contactPhone) {
			qb.whereHas("contact", (query) => {
				if (data.contactName) {
					query.where("name", "ilike", `%${data.contactName}%`);
				}

				if (data.contactPhone) {
					query.whereHas("contacts", (query) => {
						query.whereRaw(
							`patient_contacts.type <> 'email'
  and (
    case
        when length(patient_contacts.contact) = 10 and length(?) = 11 then
            SUBSTRING(patient_contacts.contact, 1, 2) || '9' || SUBSTRING(patient_contacts.contact, 3, 8) ilike
            ? -- add o 9
        when length(patient_contacts.contact) = 11 and length(?) = 10 then patient_contacts.contact ilike
                                                                           '%' ||
                                                                           SUBSTRING(?, 1, 2) ||
                                                                           '9' ||
                                                                           SUBSTRING(?, 3, 8) ||
                                                                           '%' -- add o 9
        else patient_contacts.contact ilike ? end
    )`,
							[
								data.contactPhone ?? "",
								`%${data.contactPhone ?? ""}%`,
								data.contactPhone ?? "",
								data.contactPhone ?? "",
								data.contactPhone ?? "",
								`%${data.contactPhone ?? ""}%`,
							],
						);
					});
				}
			});
		}

		if (data.patientName) {
			qb.whereHas("client", (query) => {
				if (data.patientName) {
					query.where("name", "ilike", `%${data.patientName}%`);
				}
			});
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			openingDate: elem.openingDate,
			contactDate: elem.contactDate,
			value: elem.value,
			description: elem.description,
			observation: elem.observation,
			closingDate: elem.closingDate,
			profitValue: elem.profitValue,
			resultObservation: elem.resultObservation,
			clientOriginItemDescription: elem.clientOriginItemDescription,
			balance: elem.balance,
			active: elem.active,
			race: {
				id: elem.race_id ?? null,
			},
			gender: elem.gender,
			castrated: elem.castrated,
			weight: elem.weight,

			status: elem.status,
			contact: this.sharedService.captureGroup(elem.contact, (v) => ({
				id: v.id,
				name: v.name,
				email: v.tutor?.email ?? null,
				cellphone: v.tutor?.cellphone ?? null,
				telepone: v.tutor?.telephone ?? null,
			})),

			contactType: elem.contactType,
			contactSubject: elem.contactSubject,
			client: elem.client,
			clientOrigin: elem.clientOrigin,

			user: this.sharedService.captureGroup(elem?.user, (v) => ({
				id: v.id,
				name: v.name,
			})),
			unit: {
				id: elem.unit.id,
				companyName: elem.unit.companyName,
				fantasyName: elem.unit.fantasyName,
			},
			schedule: {
				id: elem.schedule_id ?? null,
			},
			closingUser: {
				id: elem.closing_user_id ?? null,
			},
			reason: this.sharedService.captureGroup(elem.reason, (v) => ({
				id: v.id,
				reason: v.reason,
			})),
		}));
	}

	public async searchActivities(
		authCtx: AuthContext,
		data: {
			fromDate?: string;
			toDate?: string;
			description?: string;
			contactName?: string;
			patientName?: string;
			technicianName?: string;
			status?: string;
			clientName?: string;
		},
	) {
		const qb = OpportunityActivity.query()
			.preload("activity")
			.preload("opportunity", (query) => {
				query
					.preload("client")
					.preload("contact", (query) => {
						query.preload("tutor");
					})
					.preload("user")
					.preload("reason");
			})
			.preload("user")
			.preload("executionUser")
			.preload("openingUser")
			.preload("exclusionUser")
			.whereHas("opportunity", (query) => {
				query.where("economic_group_id", authCtx.group.id);
			});

		if (data.fromDate) {
			qb.whereRaw("execution_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.whereRaw("execution_date::date <= ?", [data.toDate]);
		}

		if (data.status) {
			qb.where("status", data.status);
		}

		if (data.clientName) {
			qb.whereHas("opportunity", (query) => {
				query.whereHas("client", (query) => {
					query
						.whereRaw("name ~* ?", [
							`(${data.clientName?.toLowerCase().split(" ").join("|")})`,
						])
						.where("type", PatientType.ANIMAL);
				});
			});
		}

		if (data.technicianName) {
			qb.whereHas("user", (query) => {
				query.whereILike("name", `%${data.technicianName!}%`);
			});
		}

		if (data.description) {
			qb.whereHas("activity", (query) => {
				query.whereILike("description", `%${data.description!}%`);
			});
		}

		if (data.patientName || data.contactName) {
			qb.whereHas("opportunity", (query) => {
				if (data.patientName) {
					query.whereHas("client", (query) => {
						query.whereILike("name", `%${data.patientName!}%`);
					});
				}

				if (data.contactName) {
					query.whereHas("contact", (query) => {
						query.whereILike("name", `%${data.contactName!}%`);
					});
				}
			});
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			issueDate: elem.issueDate,
			duration: elem.duration,
			executionDate: elem.executionDate,
			executedDate: elem.executedDate,
			description: elem.description,
			observation: elem.observation,
			status: elem.status,

			opportunity: this.sharedService.captureGroup(elem.opportunity, (v) => ({
				id: v.id,
				description: v.description,
				observation: v.observation,
				balance: v.balance,
			})),
			activity: {
				id: elem.activity.id,
				description: elem.activity.description,
			},
			client: elem.opportunity?.client
				? {
						id: elem.opportunity?.client.id,
						name: elem.opportunity?.client.name,
						cellphone: elem.opportunity?.client?.tutor?.cellphone ?? null,
						telephone: elem.opportunity?.client?.tutor?.telephone ?? null,
					}
				: null,
			contact: this.sharedService.captureGroup(
				elem.opportunity?.contact,
				(v) => ({
					id: v.id,
					name: v.name,
					cellphone: v?.tutor?.cellphone ?? null,
					telephone: v?.tutor?.telephone ?? null,
					email: v?.tutor?.email ?? null,
				}),
			),
			user: this.sharedService.captureGroup(elem.user, (v) => ({
				id: v.id,
				name: v.name,
			})),
			openingUser: this.sharedService.captureGroup(
				elem.opportunity?.openingUser,
				(v) => ({
					id: v.id,
					name: v.name,
				}),
			),
			closingUser: this.sharedService.captureGroup(
				elem.opportunity?.closingUser,
				(v) => ({
					id: v.id,
					name: v.name,
				}),
			),
			exclusionUser: this.sharedService.captureGroup(
				elem.opportunity?.exclusionUser,
				(v) => ({
					id: v.id,
					name: v.name,
				}),
			),
			reason: this.sharedService.captureGroup(
				elem.opportunity?.reason,
				(v) => ({
					id: v.id,
					reason: v.reason,
				}),
			),
		}));
	}

	public async searchCompleteKanbanOpportunities(
		authCtx: AuthContext,
		data: {
			openingFrom?: string;
			openingTo?: string;
			contactFrom?: string;
			contactTo?: string;
			dateFrom?: string;
			dateTo?: string;
			contactName?: string;
			contactPhone?: string;
			patientName?: string;
			// minWeight?: string;
			// maxWeight?: string;
			// specie?: string;
			// race?: string;
			// gender?: string;
			// castrated?: string;
			clientName?: string;
			technician?: string;
			status?: string;
			units?: string[];
			orderBy?: string;
		},
	) {
		const qb = Opportunity.query()
			.where("economic_group_id", authCtx.group.id)
			.whereNull("closing_date")
			.preload("client", (query) => {
				query.select("id", "name", "weight", "gender");

				query.preload("tutor");

				query.preload("patientAnimal", (query) => {
					query.select("id", "castrated", "race_id");
					query.preload("race", (query) => {
						query.select("id", "description", "specie_id");
						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});
			})
			.preload("contact", (query) => {
				query.preload("tutor", (query) => {
					query.select("id", "email", "cellphone", "telephone");
				});
			})
			.preload("contactType")
			.preload("contactSubject")
			.preload("clientOrigin")
			.preload("status")
			.preload("user")
			.preload("unit")
			.preload("reason")
			.preload("activities", (query) => {
				query.where("status", "Aberta");

				query.preload("executionUser");
				query.preload("activity");
				query.preload("openingUser");
			});

		if (data.clientName) {
			qb.whereHas("client", (query) => {
				query
					.whereRaw("name ilike ?", [
						`%${data.clientName!.replaceAll(" ", "%")}%`,
					])
					.where("type", PatientType.ANIMAL);
			});
		}

		if (data.technician) {
			qb.where("user_id", data.technician);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_unit_id", data.units);
		}

		if (data.openingFrom) {
			qb.whereRaw("opening_date::date >= ?", [data.openingFrom]);
		}

		if (data.openingTo) {
			qb.whereRaw("opening_date::date <= ?", [data.openingTo]);
		}

		if (data.contactFrom) {
			qb.whereRaw("contact_date::date >= ?", [data.contactFrom]);
		}

		if (data.contactTo) {
			qb.whereRaw("contact_date::date <= ?", [data.contactTo]);
		}

		if (data.dateFrom && data.dateTo) {
			qb.whereRaw(
				`(
    (opportunities.opening_date::date between ? and ?)
        or (opportunities.id in (select distinct opportunity_id
                                 from schedules
                                          left join (schedule_status_changes join schedule_statuses
                                                     on schedule_status_changes.schedule_status_id =
                                                        schedule_statuses.id and schedule_statuses.type in ('REC'))
                                                    on schedules.id = schedule_status_changes.schedule_id
                                 where schedules.opportunity_id = opportunities.id
                                   and (schedules.start_hour::date between ? and ?
                                     or
                                        schedule_status_changes.created_at::date between ? and ?)))
                              or (opportunities.id in (select distinct opportunity_id
                             from opportunity_logs ol
                                      join crm_statuses cs on ol.status_id = cs.id and cs.tag = 'A'
                             where ol.created_at::date between ? and ?)
           )
      )`,
				[
					data.dateFrom,
					data.dateTo,
					data.dateFrom,
					data.dateTo,
					data.dateFrom,
					data.dateTo,
					data.dateFrom,
					data.dateTo,
				],
			);
		}

		if (data.contactName) {
			qb.whereHas("contact", (query) => {
				if (data.contactName) {
					query.whereRaw("name ilike ?", [
						`%${data.contactName!.replaceAll(" ", "%")}%`,
					]);
				}
			});
		}

		if (data.patientName) {
			qb.whereHas("client", (query) => {
				if (data.patientName) {
					query.whereRaw("name ilike ?", [
						`%${data.patientName!.replaceAll(" ", "%")}%`,
					]);
				}
			});
		}

		if (data.contactPhone) {
			qb.whereHas("contact", (query) => {
				if (data.contactPhone) {
					query.whereHas("tutor", (query) => {
						query.where("cellphone", "ilike", `%${data.contactPhone}%`);
					});
				}
			});
		}

		const result = await qb;

		const statusMap = new Map<string, any[]>();
		// eslint-disable-next-line
		for (const op of result) {
			const key = ["Faltou", "Desmarcou"].includes(op.status.description)
				? "Faltou-Desmarcou"
				: op.status.description;

			if (!statusMap.has(key)) {
				statusMap.set(key, []);
			}

			statusMap.get(key)?.push({
				id: op.id,
				openingDate: op.openingDate,
				value: op.value,
				description: op.description,
				observation: op.observation,
				profitValue: op.profitValue,
				resultObservation: op.resultObservation,
				balance: op.balance,

				status: op.status,
				contact: this.sharedService.captureGroup(op.contact, (v) => ({
					id: v.id,
					name: v.name,
					email: v.tutor?.email ?? null,
					cellphone: v.tutor?.cellphone ?? null,
					telephone: v.tutor?.telephone ?? null,
				})),
				contactDate: op.contactDate,
				contactType: op.contactType,
				contactSubject: op.contactSubject,
				client: op.client,
				clientOrigin: op.clientOrigin,
				user: {
					id: op.user.id,
					name: op.user.name,
				},
				unit: {
					id: op.unit.id,
					companyName: op.unit.companyName,
					fantasyName: op.unit.fantasyName,
				},
				schedule: {
					id: op.schedule_id ?? null,
				},
				reason: this.sharedService.captureGroup(op.reason, (v) => ({
					id: v.id,
					reason: v.reason,
				})),

				activities: op.activities.map((elem) => ({
					id: elem.id,
					description: elem.description,
					executionDate: elem.executionDate,
					duration: elem.duration,
					status: elem.status,
					activity: elem.activity,
					user: this.sharedService.captureGroup(elem.openingUser, (v) => ({
						id: v.id,
						name: v.name,
					})),
				})),
			});
			// statusMap.set(op.status.description, updatedData);
		}

		const mappedResult: Record<string, unknown> = {};
		// eslint-disable-next-line
		for (const [key, value] of statusMap.entries()) {
			if (!data.orderBy) {
				mappedResult[key] = value;
				continue;
			}

			const sortedValue = value.sort((a, b) => {
				if (data.orderBy === "contactDate") {
					return (
						a.status.description.localeCompare(b.status.description) ||
						a.contactDate.toMillis() - b.contactDate.toMillis() ||
						a.contact.name.localeCompare(b.contact.name)
					);
				}

				if (data.orderBy === "openingDate") {
					return (
						a.status.description.localeCompare(b.status.description) ||
						a.openingDate.toMillis() - b.openingDate.toMillis() ||
						a.contact.name.localeCompare(b.contact.name)
					);
				}

				if (data.orderBy === "contact") {
					qb.orderByRaw(
						"crm_statuses.description, contact.name, opportunities.contact_date",
					);
					return (
						a.status.description.localeCompare(b.status.description) ||
						a.contact.name.localeCompare(b.contact.name) ||
						a.contactDate.toMillis() - b.contactDate.toMillis()
					);
				}

				if (data.orderBy === "client") {
					return (
						a.status.description.localeCompare(b.status.description) ||
						a.contact.name.localeCompare(b.contact.name) ||
						a.openingDate.toMillis() - b.openingDate.toMillis()
					);
				}

				return 0;
			});

			mappedResult[key] = sortedValue;
		}

		return mappedResult;
	}

	public async searchKanbanOpportunities(
		authCtx: AuthContext,
		data: {
			openingFrom?: string;
			openingTo?: string;
			contactFrom?: string;
			contactTo?: string;
			dateFrom?: string;
			dateTo?: string;
			contactName?: string;
			contactPhone?: string;
			patientName?: string;
			// minWeight?: string;
			// maxWeight?: string;
			// specie?: string;
			// race?: string;
			// gender?: string;
			// castrated?: string;
			clientName?: string;
			technician?: string;
			status?: string;
			units?: string[];
			orderBy?: string;
		},
	) {
		const qb = Opportunity.query()
			.where("economic_group_id", authCtx.group.id)
			.whereNull("closing_date")
			.orderByRaw("opening_date desc")
			.preload("client", (query) => {
				query.select("id", "name", "weight", "gender");

				query.preload("tutor");

				query.preload("patientAnimal", (query) => {
					query.select("id", "castrated", "race_id");
					query.preload("race", (query) => {
						query.select("id", "description", "specie_id");
						query.preload("specie", (query) => {
							query.select("id", "description");
						});
					});
				});
			})
			.preload("contact", (query) => {
				query.preload("tutor", (query) => {
					query.select("id", "email", "cellphone", "telephone");
				});
			})
			.preload("contactType")
			.preload("contactSubject")
			.preload("clientOrigin")
			.preload("status")
			.preload("user")
			.preload("unit")
			.preload("reason")
			.preload("schedule", (query) => {
				query.select("id", "start_hour");
			})
			.preload("activities", (query) => {
				query.where("status", "Aberta");

				query.preload("executionUser");
				query.preload("activity");
				query.preload("openingUser");
			});

		if (data.clientName) {
			qb.whereHas("client", (query) => {
				query
					.whereRaw("name ilike ?", [
						`%${data.clientName!.replaceAll(" ", "%")}%`,
					])
					.where("type", PatientType.ANIMAL);
			});
		}

		if (data.technician) {
			qb.where("user_id", data.technician);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_unit_id", data.units);
		}

		if (data.openingFrom) {
			qb.whereRaw("opening_date::date >= ?", [data.openingFrom]);
		}

		if (data.openingTo) {
			qb.whereRaw("opening_date::date <= ?", [data.openingTo]);
		}

		if (data.contactFrom) {
			qb.whereRaw("contact_date::date >= ?", [data.contactFrom]);
		}

		if (data.contactTo) {
			qb.whereRaw("contact_date::date <= ?", [data.contactTo]);
		}

		if (data.dateFrom && data.dateTo) {
			qb.whereRaw(
				`(
    (opportunities.opening_date::date between ? and ?)
        or (opportunities.id in (select distinct opportunity_id
                                 from schedules
                                          left join (schedule_status_changes join schedule_statuses
                                                     on schedule_status_changes.schedule_status_id =
                                                        schedule_statuses.id and schedule_statuses.type in ('REC'))
                                                    on schedules.id = schedule_status_changes.schedule_id
                                 where schedules.opportunity_id = opportunities.id
                                   and (schedules.start_hour::date between ? and ?
                                     or
                                        schedule_status_changes.created_at::date between ? and ?)))
                              or (opportunities.id in (select distinct opportunity_id
                             from opportunity_logs ol
                                      join crm_statuses cs on ol.status_id = cs.id and cs.tag = 'A'
                             where ol.created_at::date between ? and ?)
           )
      )`,
				[
					data.dateFrom,
					data.dateTo,
					data.dateFrom,
					data.dateTo,
					data.dateFrom,
					data.dateTo,
					data.dateFrom,
					data.dateTo,
				],
			);
		}

		if (data.contactName) {
			qb.whereHas("contact", (query) => {
				if (data.contactName) {
					query.whereRaw("name ilike ?", [
						`%${data.contactName!.replaceAll(" ", "%")}%`,
					]);
				}
			});
		}

		if (data.patientName) {
			qb.whereHas("client", (query) => {
				if (data.patientName) {
					query.whereRaw("name ilike ?", [
						`%${data.patientName!.replaceAll(" ", "%")}%`,
					]);
				}
			});
		}

		if (data.contactPhone) {
			qb.whereHas("contact", (query) => {
				if (data.contactPhone) {
					query.whereHas("tutor", (query) => {
						query.where("cellphone", "ilike", `%${data.contactPhone}%`);
					});
				}
			});
		}

		const result = await qb;

		const statusMap = new Map<string, any[]>();
		// eslint-disable-next-line
		for (const op of result) {
			const key = ["Faltou", "Desmarcou"].includes(op.status.description)
				? "Faltou-Desmarcou"
				: op.status.description;

			if (!statusMap.has(key)) {
				statusMap.set(key, []);
			}

			statusMap.get(key)?.push({
				id: op.id,
				openingDate: op.openingDate,
				description: op.description,
				balance: op.balance,

				status: this.sharedService.captureGroup(op.status, (v) => ({
					id: v.id,
					description: v.description,
				})),
				contact: this.sharedService.captureGroup(op.contact, (v) => ({
					id: v.id,
					name: v.name,
					cellphone: v.tutor?.cellphone ?? null,
				})),
				contactDate: op.contactDate,
				client: this.sharedService.captureGroup(op.client, (v) => ({
					id: v.id,
					name: v.name,
				})),
				clientOrigin: op.clientOrigin,
				user: this.sharedService.captureGroup(op?.user, (v) => ({
					id: v.id,
					name: v.name,
				})),
				unit: {
					id: op.unit.id,
					companyName: op.unit.companyName,
					fantasyName: op.unit.fantasyName,
				},
				schedule: this.sharedService.captureGroup(op.schedule, (v) => ({
					id: v.id,
					startHour: v.startHour,
				})),

				activities: op.activities.map((elem) => ({
					id: elem.id,
					description: elem.description,
					executionDate: elem.executionDate,
					duration: elem.duration,
					activity: {
						id: elem.activity.id,
						description: elem.activity.description,
						duration: elem.activity.duration,
					},
					user: this.sharedService.captureGroup(elem.openingUser, (v) => ({
						id: v.id,
						name: v.name,
					})),
				})),
			});
			// statusMap.set(op.status.description, updatedData);
		}

		const mappedResult: Record<string, unknown> = {};
		// eslint-disable-next-line
		for (const [key, value] of statusMap.entries()) {
			if (!data.orderBy) {
				mappedResult[key] = value;
				continue;
			}
			//
			// const sortedValue = value.sort((a, b) => {
			// 	if (data.orderBy === "contactDate") {
			// 		return (
			// 			a.status.description.localeCompare(b.status.description) ||
			// 			a.contactDate.toMillis() - b.contactDate.toMillis() ||
			// 			a.contact.name.localeCompare(b.contact.name)
			// 		);
			// 	}
			//
			// 	if (data.orderBy === "openingDate") {
			// 		return (
			// 			a.status.description.localeCompare(b.status.description) ||
			// 			a.openingDate.toMillis() - b.openingDate.toMillis() ||
			// 			a.contact.name.localeCompare(b.contact.name)
			// 		);
			// 	}
			//
			// 	if (data.orderBy === "contact") {
			// 		return (
			// 			a.status.description.localeCompare(b.status.description) ||
			// 			a.contact.name.localeCompare(b.contact.name) ||
			// 			a.contactDate.toMillis() - b.contactDate.toMillis()
			// 		);
			// 	}
			//
			// 	if (data.orderBy === "client") {
			// 		return (
			// 			a.status.description.localeCompare(b.status.description) ||
			// 			a.contact.name.localeCompare(b.contact.name) ||
			// 			a.openingDate.toMillis() - b.openingDate.toMillis()
			// 		);
			// 	}
			//
			// 	return 0;
			// });

			// mappedResult[key] = sortedValue;
			mappedResult[key] = value;
		}

		return mappedResult;
	}

	public async searchKanbanOpportunityActivities(
		authCtx: AuthContext,
		data: {
			activity?: string;
			opportunity?: string;
			clientName?: string;
		},
	) {
		const qb = OpportunityActivity.query()
			.whereHas("activity", (query) => {
				query.where("economic_group_id", authCtx.group.id);
			})
			.preload("executionUser")
			.preload("openingUser")
			.preload("activity");
		// .preload('opportunity', query => {
		//   query
		//     .preload('client')
		//     .preload('contact')
		//     .preload('status')
		//     .preload('user')
		//     .preload('unit');
		// });

		if (data.clientName) {
			qb.whereHas("opportunity", (query) => {
				query.whereHas("client", (query) => {
					query
						.whereRaw("name ~* ?", [
							`(${data.clientName?.toLowerCase().split(" ").join("|")})`,
						])
						.where("type", PatientType.ANIMAL);
				});
			});
		}

		if (data.activity) {
			qb.where("activity_id", data.activity);
		}

		if (data.opportunity) {
			qb.where("opportunity_id", data.opportunity);
		}

		return qb;
	}

	public async store(
		authCtx: AuthContext,
		data: {
			userId: string;
			statusId: number;
			contactDate: DateTime;

			businessUnitId?: string;
			clientId?: string;
			contactId?: string;
			contactTypeId?: number;
			contactSubjectId?: number;
			originId?: string;
			raceId?: string;

			clientOriginItemDescription?: string;
			description?: string;
			observation?: string;
			value?: number;
			gender?: string;
			weight?: number;
			castrated?: boolean;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.create(
				{
					system_id: authCtx.system.id,
					business_unit_id: data.businessUnitId ?? authCtx.unit.id,
					economic_group_id: authCtx.group.id,
					opening_user_id: authCtx.user.id,
					user_id: data.userId,
					client_id: data.clientId,
					contact_id: data.contactId,
					status_id: data.statusId,
					contact_type_id: data.contactTypeId,
					contact_subject_id: data.contactSubjectId,
					client_origin_id: data.originId,
					race_id: data.raceId,

					clientOriginItemDescription: data.clientOriginItemDescription,
					origin: "crm",
					openingDate: DateTime.now(),
					contactDate: data.contactDate,
					description: data.description,
					observation: data.observation,
					value: data.value,
					gender: data.gender,
					weight: data.weight,
					castrated: data.castrated,
				},
				{
					client: trx,
				},
			);

			if (data.clientId && data.clientOriginItemDescription) {
				await Patient.query()
					.update({
						client_origin_item_description: data.clientOriginItemDescription,
					})
					.where("id", data.clientId)
					.useTransaction(trx)
					.exec();
			}

			await this.createLog(model, trx);
		});
	}

	public async storeFromSchedule(
		authCtx: AuthContext,
		data: {
			scheduleId: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const schedule = await Schedule.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.scheduleId)
				.preload("serviceType")
				.preload("holder")
				.preload("patient", (q) => {
					q.preload("patientAnimal");
				})
				.first();

			if (!schedule) {
				throw this.sharedService.ResourceNotFound("Agendamento não encontrado");
			}

			if (schedule.serviceType.type !== "A") {
				throw new BadRequestException(
					"Tipo de Agendamento precisa ser A",
					400,
					"E_ERR",
				);
			}

			const status = await CrmStatus.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.where("type", "OP")
				.where("tag", "N")
				.first();
			if (!status) {
				throw new BadRequestException(
					"Não tem status de oportunidade válido",
					400,
					"E_ERR",
				);
			}

			const model = await Opportunity.create(
				{
					system_id: authCtx.system.id,
					business_unit_id: authCtx.unit.id,
					economic_group_id: authCtx.group.id,
					opening_user_id: authCtx.user.id,
					user_id: authCtx.user.id,
					contact_id: schedule.holder_id
						? schedule.holder_id
						: schedule.patient_id,
					// client_origin_id: schedule.holder_id ? schedule.holder_id : schedule.patient.patientAnimal.
					status_id: status.id,
					openingDate: DateTime.now(),
					contactDate: DateTime.now(),
					description: schedule.serviceType.description,
					observation: schedule.majorComplaint,
					value: 0,
					active: true,
					origin: "agenda",
					schedule_id: schedule.id,
					client_id: schedule.holder_id ? undefined : schedule.patient_id,
					race_id: schedule.holder_id
						? undefined
						: schedule.patient?.patientAnimal.race_id,
					gender: schedule.holder_id ? undefined : schedule.patient.gender,
					weight: schedule.holder_id ? undefined : schedule.patient.weight,
					castrated: schedule.holder_id
						? undefined
						: schedule.patient?.patientAnimal.castrated,
				},
				{
					client: trx,
				},
			);

			await schedule
				.merge({ opportunity_id: model.id })
				.useTransaction(trx)
				.save();
		});
	}
	public async update(
		authCtx: AuthContext,
		id: number,
		data: {
			userId: string;
			statusId: number;
			contactDate: DateTime;

			businessUnitId?: string;
			clientId?: string;
			contactId?: string;
			contactTypeId?: number;
			contactSubjectId?: number;
			originId?: string;
			raceId?: string;

			clientOriginItemDescription?: string;
			description?: string;
			observation?: string;
			value?: number;
			active?: boolean;
			gender?: string;
			weight?: number;
			castrated?: boolean;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			const result = await model
				.merge({
					user_id: data.userId,
					client_id: data.clientId,
					contact_id: data.contactId,
					status_id: data.statusId,
					contact_type_id: data.contactTypeId,
					contact_subject_id: data.contactSubjectId,
					client_origin_id: data.originId,
					race_id: data.raceId,

					clientOriginItemDescription: data.clientOriginItemDescription,
					contactDate: data.contactDate,
					description: data.description,
					observation: data.observation,
					value: data.value,
					active: data.active,
					gender: data.gender,
					weight: data.weight,
					castrated: data.castrated,
				})
				.useTransaction(trx)
				.save();

			if (data.clientId) {
				const row = await Patient.query()
					.useTransaction(trx)
					.where("id", data.clientId)
					.preload("patientAnimal")
					.firstOrFail();

				await row
					.merge({
						weight: data.weight,
						gender: data.gender as PatientGender,
					})
					.useTransaction(trx)
					.save();

				if (row.patientAnimal) {
					await row.patientAnimal
						.merge({
							race_id: data.raceId,
							castrated: data.castrated,
						})
						.useTransaction(trx)
						.save();
				}
			}

			await this.createLog(result, trx);
		});
	}

	public async exclude(authCtx: AuthContext, id: number) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			if (model.closingDate) {
				throw new BadRequestException(
					"Não é possível excluir uma oportunidade fechada.",
					400,
					"E_ERR",
				);
			}

			await model
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async closeWinningOpportunity(
		authCtx: AuthContext,
		id: number,
		data: {
			reasonId: string;
			value: number;
			observation?: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			const result = await model
				.merge({
					reason_id: data.reasonId,
					closing_user_id: authCtx.user.id,

					closingDate: DateTime.now(),
					balance: "Ganho",
					resultObservation: data.observation,
					profitValue: data.value,
				})
				.useTransaction(trx)
				.save();

			const status = await CrmStatus.firstOrCreate(
				{
					type: "OPR",
					tag: "G",
					description: "Ganho",
					system_id: authCtx.system.id,
				},
				{
					type: "OPR",
					tag: "G",
					description: "Ganho",
					system_id: authCtx.system.id,
				},
				{
					client: trx,
				},
			);
			const stubResult = result.merge({ status_id: status.id });
			await this.createLog(stubResult, trx);
		});
	}

	public async closeLoosingOpportunity(
		authCtx: AuthContext,
		id: number,
		data: {
			reasonId: string;
			observation?: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			const result = await model
				.merge({
					reason_id: data.reasonId,
					closing_user_id: authCtx.user.id,

					closingDate: DateTime.now(),
					balance: "Perda",
					resultObservation: data.observation,
				})
				.useTransaction(trx)
				.save();

			const status = await CrmStatus.firstOrCreate(
				{
					type: "OPR",
					tag: "P",
					description: "Perda",
					system_id: authCtx.system.id,
				},
				{
					type: "OPR",
					tag: "P",
					description: "Perda",
					system_id: authCtx.system.id,
				},
				{
					client: trx,
				},
			);
			const stubResult = result.merge({ status_id: status.id });
			await this.createLog(stubResult, trx);
		});
	}

	public async reopenOpportunity(authCtx: AuthContext, id: number) {
		return await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			if (model.balance !== "Ganho" && model.balance !== "Perda") {
				throw new BadRequestException(
					"Não é possível reabrir uma oportunidade que não foi ganha ou perdida.",
					400,
					"E_INVALID",
				);
			}

			await Database.from("opportunities")
				.update({
					closing_user_id: null,
					closing_date: null,
					balance: null,
					profit_value: null,
					reason_id: null,
					result_observation: null,
				})
				.where("id", model.id)
				.useTransaction(trx);

			const result = await model.refresh();

			await this.createLog(result, trx);

			return {
				message: "Oportunidade reaberta",
			};
		});
	}

	public async updateStatus(
		authCtx: AuthContext,
		id: number,
		data: {
			statusId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			const result = await model
				.merge({
					status_id: data.statusId,
				})
				.useTransaction(trx)
				.save();

			await this.createLog(result, trx);
		});
	}

	public async updateUser(
		authCtx: AuthContext,
		id: number,
		data: {
			userId: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("economic_group_id", authCtx.group.id)
				.where("id", id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			const result = await model
				.merge({
					user_id: data.userId,
				})
				.useTransaction(trx)
				.save();

			await this.createLog(result, trx);
		});
	}

	public async addActivity(
		authCtx: AuthContext,
		data: {
			opportunityId: number;
			userId: string;
			activityId: number;

			executionDate: DateTime;
			duration: number;
			description?: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.where("id", data.opportunityId)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			await OpportunityActivity.create(
				{
					opportunity_id: data.opportunityId,
					opening_user_id: authCtx.user.id,
					user_id: data.userId,
					activity_id: data.activityId,

					issueDate: DateTime.now(),
					executionDate: data.executionDate,
					duration: data.duration,
					description: data.description,
					status: "Aberta",
				},
				{
					client: trx,
				},
			);
		});
	}

	public async updateActivity(
		authCtx: AuthContext,
		data: {
			id: number;
			userId: string;
			activityId: number;

			executionDate: DateTime;
			duration: number;
			description?: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await OpportunityActivity.query()
				.useTransaction(trx)
				.where("id", data.id)
				.whereHas("opportunity", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				})
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			await model
				.merge({
					opening_user_id: authCtx.user.id,
					user_id: data.userId,
					activity_id: data.activityId,

					executionDate: data.executionDate,
					duration: data.duration,
					description: data.description,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async executeActivity(
		authCtx: AuthContext,
		id: number,
		data: {
			observation?: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const activity = await OpportunityActivity.query()
				.useTransaction(trx)
				.where("id", id)
				.whereHas("opportunity", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				})
				.first();

			if (!activity) {
				throw this.sharedService.ResourceNotFound();
			}

			if (activity.status !== "Aberta") {
				throw new BadRequestException(
					"Atividade já executada ou cancelada",
					400,
					"E_ERR",
				);
			}

			await activity
				.merge({
					execution_user_id: authCtx.user.id,
					executedDate: DateTime.now(),
					observation: data.observation,
					status: "Executada",
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async reopenActivity(authCtx: AuthContext, id: number) {
		await Database.transaction(async (trx) => {
			const activity = await OpportunityActivity.query()
				.useTransaction(trx)
				.where("id", id)
				.whereHas("opportunity", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				})
				.first();

			if (!activity) {
				throw this.sharedService.ResourceNotFound();
			}

			if (!activity.executedDate) {
				throw new BadRequestException(
					"Atividade não executada",
					400,
					"E_INVALID",
				);
			}

			await this.createActivityLog(activity, trx);

			await Database.from("opportunity_activities")
				.where("id", id)
				.update({
					execution_user_id: null,
					executed_date: null,
					status: "Aberta" as TOpportunityActivityStatus,
				});
		});
	}

	public async cancelActivity(
		authCtx: AuthContext,
		id: number,
		data: {
			observation: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const activity = await OpportunityActivity.query()
				.useTransaction(trx)
				.where("id", id)
				.whereHas("opportunity", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				})
				.first();

			if (!activity) {
				throw this.sharedService.ResourceNotFound();
			}

			if (activity.status !== "Aberta") {
				throw new BadRequestException(
					"Atividade já executada ou cancelada",
					400,
					"E_ERR",
				);
			}

			await activity
				.merge({
					execution_user_id: authCtx.user.id,
					executionDate: DateTime.now(),
					observation: data.observation,
					status: "Cancelada",
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async excludeActivity(authCtx: AuthContext, id: number) {
		await Database.transaction(async (trx) => {
			const activity = await OpportunityActivity.query()
				.useTransaction(trx)
				.where("id", id)
				.whereHas("opportunity", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				})
				.first();

			if (!activity) {
				throw this.sharedService.ResourceNotFound();
			}

			if (activity.status !== "Aberta") {
				throw new BadRequestException(
					"Atividade já executada, cancelada ou excluída",
					400,
					"E_ERR",
				);
			}

			await activity
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
					status: "Excluida",
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async searchSyncableOpportunities(
		authCtx: AuthContext,
		data: {
			group?: string;
			client?: string;
			contact?: string;
		},
	) {
		if (!data.client) {
			throw new BadRequestException("Cliente não informado", 400, "E_ERR");
		}

		if (!data.contact) {
			throw new BadRequestException("Contato não informado", 400, "E_ERR");
		}

		const qb = Database.from("opportunities")
			.select(
				"opportunities.id as opID",
				"opportunities.description as opDescription",
				"contact.id as contactID",
				"contact.name as contactName",
				"client.id as clientID",
				"client.name as clientName",
				"crm_statuses.id as statusID",
				"crm_statuses.description as statusDescription",
			)
			.joinRaw(
				`left join patients client on client.id = opportunities.client_id`,
			)
			.joinRaw(
				`left join patients contact on contact.id = opportunities.contact_id`,
			)
			.joinRaw(
				`left join crm_statuses on crm_statuses.id = opportunities.status_id`,
			)
			.where("opportunities.economic_group_id", data.group ?? authCtx.group.id)
			.whereNull("opportunities.closing_date")
			.whereRaw(
				`
              (
                (opportunities.client_id = ?) or
                (opportunities.contact_id = ? and opportunities.client_id is null)
              )`,
				[data.client, data.contact],
			)
			.whereRaw(
				`("opportunities"."schedule_id" is null or ("opportunities"."schedule_id" in (select s.id
                                                                                   from schedules s
                                                                                            join schedule_statuses ss
                                                                                                 on s.schedule_status_id = ss.id and ss.type in ('FAL', 'CANC'))))`,
				[],
			)
			.whereNull("opportunities.deleted_at");

		const result = await qb;

		return result.map((elem) => ({
			id: elem.opID,
			description: elem.opDescription ?? "-",
			contact: elem.contactID
				? {
						id: elem.contactID ?? null,
						name: elem?.contactName ?? null,
					}
				: null,
			client: elem?.clientID
				? {
						id: elem?.clientID ?? null,
						name: elem?.clientName ?? null,
					}
				: null,
			status: elem?.statusID
				? {
						id: elem?.statusID ?? null,
						description: elem?.statusDescription ?? null,
					}
				: null,
		}));
	}

	public async searchSyncableSchedules(
		authCtx: AuthContext,
		data: {
			group?: string;
			client?: string;
			contact?: string;
		},
	) {
		if (!data.client) {
			throw new BadRequestException("Cliente não informado", 400, "E_ERR");
		}

		if (!data.contact) {
			throw new BadRequestException("Contato não informado", 400, "E_ERR");
		}

		const qb = Database.from("schedules")
			.select(
				"schedules.id",
				"schedules.start_hour",
				"schedules.major_complaint",
				"schedule_statuses.description",
			)
			.joinRaw(
				`join schedule_statuses on schedules.schedule_status_id = schedule_statuses.id`,
			)
			.joinRaw(
				`join schedule_service_types on schedules.schedule_service_type_id = schedule_service_types.id and schedule_service_types."type" = 'A'`,
			)
			.joinRaw(
				`join business_units on schedules.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.where("economic_groups.id", data.group ?? authCtx.group.id)
			.whereNull("schedules.deleted_at")
			.whereNull("schedules.opportunity_id")
			.whereNot("schedule_statuses.type", "CANC" as ScheduleStatusType)
			.whereRaw(
				`
              (
                (schedules.patient_id = ?) or
                (schedules.holder_id = ? and schedules.holder_id is null)
              )`,
				[data.client, data.contact],
			);

		return qb;
	}

	public async syncSchedules(
		authCtx: AuthContext,
		data: {
			scheduleId: string;
			opportunityId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.useTransaction(trx)
				.preload("schedule", (query) => {
					query.preload("serviceStatus");
				})
				.where("economic_group_id", authCtx.group.id)
				.where("id", data.opportunityId)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound(
					"Oportunidade não encontrada",
				);
			}

			if (
				model.schedule_id &&
				!["FAL", "CANC"].includes(model.schedule.serviceStatus.type)
			) {
				throw new BadRequestException(
					"Oportunidade já possui agendamento",
					400,
					"E_ERR",
				);
			}

			const schedule = await Schedule.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.scheduleId)
				.first();

			if (!schedule) {
				throw this.sharedService.ResourceNotFound("Agendamento não encontrado");
			}

			if (schedule.opportunity_id) {
				throw new BadRequestException(
					"Agendamento já contem oportunidade",
					400,
					"E_ERR",
				);
			}

			if (!schedule.patient_id) {
				throw new BadRequestException(
					"Agendamento não possui paciente",
					400,
					"E_ERR",
				);
			}

			const status = await CrmStatus.query()
				.useTransaction(trx)
				.where("system_id", authCtx.system.id)
				.whereRaw("((economic_group_id = ?) or (economic_group_id is null))", [
					authCtx.group.id,
				])
				.where("type", "OP")
				.where("tag", "A")
				.where("system_id", authCtx.system.id)
				.where("active", true)
				.first();
			if (!status) {
				throw this.sharedService.ResourceNotFound("Status não encontrado");
			}

			const result = await model
				.merge({
					schedule_id: schedule.id,
					status_id: status.id,
				})
				.useTransaction(trx)
				.save();

			await schedule
				.merge({
					opportunity_id: model.id,
				})
				.useTransaction(trx)
				.save();

			await this.createLog(result, trx);
		});
	}

	public async updateOpportunityScheduleAsAttended(
		authCtx: AuthContext,
		schedule: Schedule,
		trx: TransactionClientContract,
	) {
		if (!schedule.opportunity_id) {
			return;
		}

		const model = await Opportunity.query()
			.where("business_unit_id", schedule.business_unit_id)
			.where("id", schedule.opportunity_id)
			.first();
		if (!model) {
			return;
		}

		const status = await CrmStatus.query()
			.useTransaction(trx)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("type", "OP")
			.where("tag", "C")
			.where("system_id", authCtx.system.id)
			.where("active", true)
			.first();
		if (!status) {
			return;
		}

		await model
			.merge({
				status_id: status.id,
			})
			.useTransaction(trx)
			.save();

		await this.createLog(model, trx);
	}

	public async updateOpportunityScheduleAsUnchecked(
		authCtx: AuthContext,
		schedule: Schedule,
		trx: TransactionClientContract,
	) {
		if (!schedule.opportunity_id) {
			return;
		}

		const model = await Opportunity.query()
			.where("business_unit_id", schedule.business_unit_id)
			.where("id", schedule.opportunity_id)
			.first();
		if (!model) {
			return;
		}

		const status = await CrmStatus.query()
			.useTransaction(trx)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("type", "OP")
			.where("tag", "D")
			.where("active", true)
			.first();
		if (!status) {
			return;
		}

		await model
			.merge({
				status_id: status.id,
			})
			.useTransaction(trx)
			.save();

		await this.createLog(model, trx);
	}

	public async updateOpportunityPatient(
		authCtx: AuthContext,
		data: {
			opportunityId: number;
			patientId: string;
		},
	) {
		await Database.transaction(async (trx) => {
			const model = await Opportunity.query()
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.opportunityId)
				.first();
			if (!model) {
				throw this.sharedService.ResourceNotFound(
					"Oportunidade não encontrada",
				);
			}

			await model
				.merge({
					client_id: data.patientId,
				})
				.useTransaction(trx)
				.save();
		});
	}

	private async createLog(model: Opportunity, client?: QueryClientContract) {
		await OpportunityLog.create(
			{
				opportunity_id: model.id,

				economic_group_id: model.economic_group_id,
				business_unit_id: model.business_unit_id,
				user_id: model.user_id,
				client_id: model.client_id,
				contact_subject_id: model.contact_subject_id,
				contact_type_id: model.contact_type_id,
				status_id: model.status_id,
				contact_id: model.contact_id,
				schedule_id: model.schedule_id,
				closing_user_id: model.closing_user_id,
				opening_user_id: model.opening_user_id,

				balance: model.balance,
				description: model.description,
				observation: model.observation,
				reason_id: model.reason_id,
				profitValue: model.profitValue,
				resultObservation: model.resultObservation,
				value: model.value,
				contactDate: model.contactDate,
				openingDate: model.openingDate,
				closingDate: model.closingDate,
			},
			{
				client,
			},
		);
	}

	private async createActivityLog(
		model: OpportunityActivity,
		client?: QueryClientContract,
	) {
		await OpportunityActivityLog.create(
			{
				opportunity_id: model.opportunity_id,
				opening_user_id: model.opening_user_id,
				user_id: model.user_id,
				activity_id: model.activity_id,
				execution_user_id: model.execution_user_id ?? undefined,
				exclusion_user_id: model.exclusion_user_id,
				opportunity_activity_id: model.id,

				issueDate: model.issueDate,
				executionDate: model.executionDate ?? undefined,
				duration: model.duration,
				description: model.description,
				status: model.status,
				executedDate: model.executedDate,
				observation: model.observation,
			},
			{
				client,
			},
		);
	}
}
