import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import CrmStatus, { CrmStatusType } from "App/Models/CrmStatus";
import Kanban from "App/Models/Kanban";
import KanbanUser from "App/Models/KanbanUser";
import Opportunity from "App/Models/Opportunity";
import OpportunityActivity from "App/Models/OpportunityActivity";
import OpportunityKanbanLog from "App/Models/OpportunityKanbanLog";
import OpportunityLog from "App/Models/OpportunityLog";
import Patient, { PatientType } from "App/Models/Patient";
import { DateTime } from "luxon";
import SharedService, { AuthContext } from "./SharedService";

@inject()
export default class CrmV2Service {
	constructor(private sharedService: SharedService) {}

	public async transferKanban(
		authCtx: AuthContext,
		data: {
			economicGroupId: string;
			businessUnitId: string;
			opportunityId: number;
			originKanbanId: number;
			destinationKanbanId: number;
		},
	) {
		if (!authCtx.hasPermission("CRM13")) {
			throw new UnauthorizedException("Usuário sem permissão", 401, "E_ERR");
		}

		await Database.transaction(async (trx) => {
			const opp = await Opportunity.query()
				.useTransaction(trx)
				.where("economic_group_id", data.economicGroupId)
				.where("business_unit_id", data.businessUnitId)
				.where("id", data.opportunityId)
				.first();
			if (!opp) {
				throw new BadRequestException(
					"Esta oportunidade não pertence a unidade de negocios enviada",
					400,
					"E_ERR",
				);
			}

			await OpportunityKanbanLog.create(
				{
					economic_group_id: data.economicGroupId,
					business_unit_id: data.businessUnitId,
					opportunity_id: data.opportunityId,
					origin_kanban_id: data.originKanbanId,
					destination_kanban_id: data.destinationKanbanId,
					user_id: authCtx.user.id,
					createdAt: DateTime.now(),
				},
				{ client: trx },
			);

			await opp
				.merge({ kanban_id: data.destinationKanbanId })
				.useTransaction(trx)
				.save();
		});
	}

	public async listKanbans(
		authCtx: AuthContext,
		data: {
			businessUnitId?: string;
			description?: string;
			type?: string;
			active?: string;
		},
	) {
		const qb = Kanban.query()
			.where("kanbans.economic_group_id", authCtx.group.id)
			.whereNull("kanbans.deleted_at")
			.preload("creationUser")
			.preload("updatedUser")
			.preload("users", (query) => {
				query.whereNull("deleted_at");

				query.preload("user");
			})
			.preload("crmStatuses");

		if (data.businessUnitId) {
			qb.where("kanbans.business_unit_id", data.businessUnitId);
		}

		if (data.description) {
			qb.whereILike(
				"kanbans.description",
				`%${data.description
					.split(" ")
					.map((r) => r.trim())
					.filter(Boolean)
					.join("|")}%`,
			);
		}

		if (data.active === "true") {
			qb.whereRaw("kanbans.active is true");
		}

		if (data.active === "false") {
			qb.whereRaw("kanbans.active is false");
		}

		const result = await qb;

		return result.map((row) => ({
			id: row.id,
			economic_group_id: row.economic_group_id,
			business_unit_id: row.business_unit_id,
			description: row.description,
			type: row.type,
			active: row.active,
			created_at: row.createdAt,
			user_creation_id: row.creationUser.id,
			user_creation_name: row.creationUser.name,
			updated_at: row.updatedAt,
			user_update_id: row.updatedUser?.id ?? null,
			user_update_name: row.updatedUser?.name ?? null,
			kanban_users: row.users.map((inner) => ({
				user_id: inner.user_id,
				user_name: inner.user.name,
				active: inner.active,
			})),
			crm_statuses: row.crmStatuses.map((inner) => ({
				id: inner.id,
				description: inner.description,
				type: inner.type,
				tag: inner.tag,
				ganho: inner.ganho,
				perda: inner.perda,
				sync_schedules: inner.syncSchedules,
				order: inner.order,
				active: inner.active,
			})),
		}));
	}

	public async createKanban(
		authCtx: AuthContext,
		data: {
			businessUnitId?: string;
			users: string[];
			description: string;
			type?: "text";
			crmStatuses: {
				description: string;
				order: number;
				ganhoStatus: boolean;
				perdaStatus: boolean;
				syncSchedules: boolean;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const kanban = await Kanban.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: data.businessUnitId,
					user_creation_id: authCtx.user.id,

					description: data.description,
					type: data.type,
				},
				{ client: trx },
			);

			await KanbanUser.createMany(
				data.users.map((row) => ({
					kanban_id: kanban.id,
					user_creation_id: authCtx.user.id,
					user_id: row,
				})),
				{ client: trx },
			);

			await CrmStatus.createMany(
				data.crmStatuses.map<Partial<CrmStatus>>((row) => ({
					economic_group_id: authCtx.group.id,
					kanban_id: kanban.id,
					system_id: authCtx.system.id,
					user_creation_id: authCtx.user.id,

					description: row.description,
					type: "OP" as CrmStatusType,
					ganho: row.ganhoStatus,
					perda: row.perdaStatus,
					order: row.order,
					syncSchedules: row.syncSchedules,
				})),
				{ client: trx },
			);
		});
	}

	public async updateKanban(
		authCtx: AuthContext,
		data: {
			id: number;
			businessUnitId?: string;
			users: string[];
			description: string;
			type?: "text";
			active: boolean;
			crmStatuses: {
				id?: number;
				description: string;
				order: number;
				ganhoStatus: boolean;
				perdaStatus: boolean;
				syncSchedules: boolean;
				active: boolean;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const kanban = await Kanban.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.first();

			if (!kanban) {
				throw new ResourceNotFoundException(
					"Kanban não encontrado",
					404,
					"E_ERR",
				);
			}

			await kanban
				.merge({
					business_unit_id: data.businessUnitId,
					user_updated_id: authCtx.user.id,

					description: data.description,
					type: data.type,
					active: data.active,
				})
				.useTransaction(trx)
				.save();

			const existingKanbanUsers = await KanbanUser.query()
				.useTransaction(trx)
				.where("kanban_id", kanban.id);

			const toDelete = existingKanbanUsers.reduce((acc, curr) => {
				if (!data.users.includes(curr.user_id)) {
					acc.push(curr.id);
				}

				return acc;
			}, [] as number[]);

			await KanbanUser.query()
				.useTransaction(trx)
				.whereIn("id", toDelete)
				.delete();

			await KanbanUser.updateOrCreateMany(
				["kanban_id", "user_id"],
				data.users.map((row) => ({
					kanban_id: kanban.id,
					user_creation_id: authCtx.user.id,
					user_id: row,
				})),
				{ client: trx },
			);

			const tasks = data.crmStatuses.map((row) => {
				if (row.id) {
					return CrmStatus.query()
						.useTransaction(trx)
						.where("id", row.id)
						.update({
							user_updated_id: authCtx.user.id,
							description: row.description,
							ganho: row.ganhoStatus,
							perda: row.perdaStatus,
							order: row.order,
							sync_schedules: row.syncSchedules,
							active: row.active,
						});
				}

				return CrmStatus.create(
					{
						economic_group_id: authCtx.group.id,
						kanban_id: kanban.id,
						system_id: authCtx.system.id,
						user_creation_id: authCtx.user.id,
						description: row.description,
						type: "OP",
						ganho: row.ganhoStatus,
						perda: row.perdaStatus,
						order: row.order,
						syncSchedules: row.syncSchedules,
						active: row.active,
					},
					{ client: trx },
				);
			});
			await Promise.all(tasks);
		});
	}

	public async deleteKanban(
		authCtx: AuthContext,
		data: {
			id: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const kanban = await Kanban.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.first();

			if (!kanban) {
				throw new ResourceNotFoundException(
					"Kanban não encontrado",
					404,
					"E_ERR",
				);
			}

			await kanban
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async searchKanbanOpportunities(
		authCtx: AuthContext,
		data: {
			kanban?: string;
			openingFrom?: string;
			openingTo?: string;
			contactFrom?: string;
			contactTo?: string;
			dateFrom?: string;
			dateTo?: string;
			contactName?: string;
			contactPhone?: string;
			patientName?: string;
			description?: string;
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
				query.select(
					"id",
					"name",
					"weight",
					"gender",
					"client_origin_item_description",
				);

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

		if (data.kanban) {
			qb.whereHas("status", (query) => {
				query.where("kanban_id", data.kanban!);
			});
		}

		if (data.clientName) {
			qb.whereHas("client", (query) => {
				query
					.whereRaw("name ilike ?", [
						`%${data.clientName!.replaceAll(" ", "%")}%`,
					])
					.where("type", PatientType.ANIMAL);
			});
		}

		if (data.description) {
			qb.whereRaw(
				"lower(unaccent(opportunities.description)) ~* lower(unaccent(?))",
				[data.description],
			);
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
			const key = ["Faltou", "Desmarcou"].includes(
				op.status?.description ?? "Não específicado",
			)
				? "Faltou-Desmarcou"
				: (op.status?.description ?? "Não específicado");

			if (!statusMap.has(key)) {
				statusMap.set(key, []);
			}

			statusMap.get(key)?.push({
				id: op.id,
				marketingCampaignId: op.marketing_campaign_id,
				openingDate: op.openingDate,
				description: op.description,
				balance: op.balance,

				status: this.sharedService.captureGroup(op.status, (v) => ({
					id: v.id,
					description: v.description,
					ganho: v.ganho,
					perda: v.perda,
					syncSchedules: v.syncSchedules,
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
					clientOriginItemDescription: v.clientOriginItemDescription ?? null,
				})),
				clientOrigin: op.clientOrigin,
				user: this.sharedService.captureGroup(op?.user, (v) => ({
					id: v.id,
					name: v.name,
				})),
				unit: {
					id: op.unit.id,
					identification: op.unit.identification,
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
					observation: elem.observation,
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

		return Array.from(statusMap.entries()).reduce(
			(mappedResult, [key, value]) => {
				mappedResult[key] = value;
				return mappedResult;
			},
			{} as Record<string, unknown>,
		);
	}

	public async searchOpportunities(
		authCtx: AuthContext,
		data: {
			kanban?: string;
			openingFrom?: string;
			openingTo?: string;
			contactFrom?: string;
			contactTo?: string;
			contactName?: string;
			contactPhone?: string;
			patientName?: string;
			technician?: string;
			description?: string;
			clientName?: string;
			unit?: string[];
			status?: string[];
			balance?: string[];
		},
	) {
		if (!data.kanban) {
			throw new BadRequestException(
				"Parametro `kanban` é necessário",
				400,
				"E_ERR",
			);
		}

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
			.preload("clientOrigin")
			.preload("marketingCampaign", (query) => {
				query.select("id", "description");
			});

		if (data.kanban) {
			qb.whereHas("status", (query) => {
				query.where("kanban_id", data.kanban!);
			});
		}

		if (data.clientName) {
			qb.whereHas("client", (query) => {
				query
					.whereRaw("name ~* ?", [
						`(${data.clientName?.toLowerCase().split(" ").join("|")})`,
					])
					.where("type", PatientType.ANIMAL);
			});
		}

		if (data.description) {
			qb.whereRaw(
				"lower(unaccent(opportunities.description)) ~* lower(unaccent(?))",
				[data.description],
			);
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
					const clearPhone = data.contactPhone.replace(/\D/g, "");
					query.whereHas("contacts", (query) => {
						query.whereRaw(
							`patient_contacts.type <> 'email'
  and (
    case
        when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 10 and length(?) = 11 then
            SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 1, 2) || '9' || SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 3, 8) ilike
            ? -- add o 9
        when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 11 and length(?) = 10 then regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike
                                                                           '%' ||
                                                                           SUBSTRING(?, 1, 2) ||
                                                                           '9' ||
                                                                           SUBSTRING(?, 3, 8) ||
                                                                           '%' -- add o 9
        else regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike ? end
    )`,
							[
								clearPhone,
								`%${clearPhone}%`,
								clearPhone,
								clearPhone,
								clearPhone,
								`%${clearPhone}%`,
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
			marketingCampaignId: elem.marketing_campaign_id,
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
				identification: elem.unit.identification,
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
			kanban?: string;
			fromDate?: string;
			toDate?: string;
			description?: string;
			contactName?: string;
			contactPhone?: string;
			patientName?: string;
			technicianName?: string;
			status?: string;
			clientName?: string;
			units?: string[];
		},
	) {
		if (!data.kanban) {
			throw new BadRequestException(
				"Parametro `kanban` é necessário",
				400,
				"E_ERR",
			);
		}

		const qb = OpportunityActivity.query()
			.preload("activity")
			.preload("opportunity", (query) => {
				query
					.preload("unit")
					.preload("client")
					.preload("contact", (query) => {
						query.preload("tutor");
					})
					.preload("user")
					.preload("reason");

				if (data.kanban) {
					query.whereHas("status", (query) => {
						query.where("kanban_id", data.kanban!);
					});
				}
			})
			.preload("user")
			.preload("executionUser")
			.preload("openingUser")
			.preload("exclusionUser")
			.whereHas("opportunity", (query) => {
				query.where("economic_group_id", authCtx.group.id);
			});

		if (data.units && Array.isArray(data.units)) {
			qb.whereHas("opportunity", (query) => {
				query.whereIn("business_unit_id", data.units ?? []);
			});
		} else {
			qb.whereHas("opportunity", (query) => {
				query.where("business_unit_id", authCtx.unit.id);
			});
		}

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

		if (data.patientName || data.contactName || data.contactPhone) {
			qb.whereHas("opportunity", (query) => {
				if (data.patientName) {
					query.whereHas("client", (query) => {
						query.whereILike("name", `%${data.patientName!}%`);
					});
				}

				if (data.contactName || data.contactPhone) {
					query.whereHas("contact", (query) => {
						if (data.contactName) {
							query.whereILike("name", `%${data.contactName!}%`);
						}

						if (data.contactPhone) {
							const clearPhone = data.contactPhone.replace(/\D/g, "");
							query.whereHas("contacts", (query) => {
								query.whereRaw(
									`patient_contacts.type <> 'email'
  and (
    case
        when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 10 and length(?) = 11 then
            SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 1, 2) || '9' || SUBSTRING(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g'), 3, 8) ilike
            ? -- add o 9
        when length(regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g')) = 11 and length(?) = 10 then regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike
                                                                           '%' ||
                                                                           SUBSTRING(?, 1, 2) ||
                                                                           '9' ||
                                                                           SUBSTRING(?, 3, 8) ||
                                                                           '%' -- add o 9
        else regexp_replace(patient_contacts.contact, '[^0-9]', '', 'g') ilike ? end
    )`,
									[
										clearPhone,
										`%${clearPhone}%`,
										clearPhone,
										clearPhone,
										clearPhone,
										`%${clearPhone}%`,
									],
								);
							});
						}
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

			unit: this.sharedService.captureGroup(elem.opportunity.unit, (v) => ({
				id: v.id,
				identification: v.identification,
				companyName: v.companyName,
				fantasyName: v.fantasyName,
			})),
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
			client: this.sharedService.captureGroup(
				elem.opportunity?.client,
				(v) => ({
					id: v.id,
					name: v.name,
					cellphone: v?.tutor?.cellphone ?? null,
					telephone: v?.tutor?.telephone ?? null,
				}),
			),
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

	public async storeOpportunity(
		authCtx: AuthContext,
		data: {
			kanbanId: number;

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
			marketingCampaignId?: number;

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
					marketing_campaign_id: data.marketingCampaignId ?? null,
					kanban_id: data.kanbanId,

					clientOriginItemDescription: data.clientOriginItemDescription ?? null,
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
					client: trx,
				},
			);
		});
	}

	public async searchSyncableOpportunities(
		authCtx: AuthContext,
		data: {
			kanban?: string;
			group?: string;
			client?: string;
			contact?: string;
		},
	) {
		if (!data.kanban) {
			throw new BadRequestException("Cliente não informado", 400, "E_ERR");
		}

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
				"opportunities.contact_date as op_contact_date",
				"contact.id as contactID",
				"contact.name as contactName",
				"client.id as clientID",
				"client.name as clientName",
				"crm_statuses.id as statusID",
				"crm_statuses.description as statusDescription",
			)
			.joinRaw(
				"left join patients client on client.id = opportunities.client_id",
			)
			.joinRaw(
				"left join patients contact on contact.id = opportunities.contact_id",
			)
			.joinRaw(
				"left join crm_statuses on crm_statuses.id = opportunities.status_id",
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

		if (data.kanban) {
			qb.where("crm_statuses.kanban_id", data.kanban);
		}

		const result: {
			opID: string;
			opDescription: string;
			op_contact_date: string;
			contactID: string | null;
			contactName: string | null;
			clientID: string | null;
			clientName: string | null;
			statusID: string | null;
			statusDescription: string | null;
		}[] = await qb;

		return result.map((elem) => ({
			id: elem.opID,
			description: elem.opDescription ?? "-",
			contactDate: elem.op_contact_date ?? "-",
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
}
