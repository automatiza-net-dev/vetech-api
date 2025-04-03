import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import CrmStatus, { CrmStatusType } from "App/Models/CrmStatus";
import Kanban from "App/Models/Kanban";
import KanbanUser from "App/Models/KanbanUser";
import Opportunity from "App/Models/Opportunity";
import { PatientType } from "App/Models/Patient";
import { DateTime } from "luxon";
import SharedService, { AuthContext } from "./SharedService";

@inject()
export default class CrmV2Service {
	constructor(private sharedService: SharedService) {}

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
			.preload("status", (query) => {
				if (data.kanban) {
					query.where("kanban_id", data.kanban);
				}
			})
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
			const key = ["Faltou", "Desmarcou"].includes(op.status.description)
				? "Faltou-Desmarcou"
				: op.status.description;

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
}
