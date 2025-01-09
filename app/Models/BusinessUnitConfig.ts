import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import VariationGroup from "App/Models/VariationGroup";
import { DateTime } from "luxon";
import * as z from "zod";

const ConfigCrmSchema = z.object({
	crm_useful_days: z.optional(z.boolean()),
	default_funnel_meta_id: z.optional(z.number()),
});

const ConfigBillSchema = z.object({
	sale_exit_account_plan_id: z.optional(z.string().uuid()),
	other_exit_account_plan_id: z.optional(z.string().uuid()),
	requires_bill_patient: z.optional(z.boolean()),
});

const ConfigReceiptSchema = z.object({
	order_entry_account_plan_id: z.optional(z.string().uuid()),
	other_entry_account_plan_id: z.optional(z.string().uuid()),
	generate_finances_on_receipt_finish: z.optional(z.boolean()),
});

const ConfigSchema = z.object({
	crm: ConfigCrmSchema,
	bill: ConfigBillSchema,
	receipt: ConfigReceiptSchema,
});

type TConfigSchema = z.infer<typeof ConfigSchema>;

export default class BusinessUnitConfig extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		columnName: "balance_control",
	})
	public balanceControl: "realizado" | "previsto";

	@column({})
	public treatment: boolean;

	@column({
		columnName: "integrates_to_crm_schedules",
	})
	public integratesToCrmSchedules: boolean;

	@column({
		columnName: "dashboard_lists_retroactive_schedules",
	})
	public dashboardListsRetroactiveSchedules: boolean;

	@column({
		columnName: "controls_deposit",
	})
	public controlsDeposit: boolean;

	@column({
		columnName: "shows_treatment_schedules",
	})
	public showsTreatmentSchedules: boolean;

	@column({
		columnName: "alter_prices",
	})
	public alterPrices: boolean;

	@column({
		columnName: "xml_download_authorization",
	})
	public xmlDownloadAuthorization: string;

	@column({
		columnName: "focus_homologation_token",
	})
	public focusHomologationToken: string;

	@column({
		columnName: "focus_production_token",
	})
	public focusProductionToken: string;

	@column({
		columnName: "requires_schedule_tutor",
	})
	public requiresScheduleTutor: boolean;

	@column({
		columnName: "requires_client_document",
	})
	public requiresClientDocument: boolean;

	@column({
		columnName: "requires_bill_patient",
	})
	public requiresBillPatient: boolean;

	@column({
		columnName: "generates_finances_on_receipts_finish",
	})
	public generatesFinancesOnReceiptsFinish: boolean;

	@column({
		columnName: "requires_finance_client",
	})
	public requiresFinanceClient: boolean;

	@column({
		columnName: "fiscal_document_environment",
	})
	public fiscalDocumentEnvironment: string;

	@column({
		columnName: "allow_change_schedule_duration",
	})
	public allowChangeScheduleDuration: string;

	@column({
		columnName: "return_interval",
	})
	public returnInterval: number;

	@column({
		columnName: "crm_useful_days",
	})
	public crmUsefulDays: boolean;

	@column({
		columnName: "schedule_late_minutes",
	})
	public scheduleLateMinutes: number;

	@column({
		columnName: "schedule_missed_minutes",
	})
	public scheduleMissedMinutes: number;

	@column({
		columnName: "allowed_return_qty",
	})
	public allowedReturnQty: number;

	@column({
		columnName: "show_treatment_executions_schedule",
	})
	public showTreatmentExecutionsSchedule: boolean;

	@column({
		columnName: "bill_counter",
	})
	public billCounter: string;

	@column({
		columnName: "budget_counter",
	})
	public budgetCounter: string;

	@column({})
	public interval: number;

	@column({
		columnName: "locked_daily_movement_date",
	})
	public lockedDailyMovementDate: boolean;

	@column({
		columnName: "daily_cashier_type",
	})
	public dailyCashierType: "usuario" | "geral";

	@column({
		columnName: "default_nfse_description",
	})
	public defaultNfseDescription: string | null;

	@column({
		columnName: "dre_report_file",
	})
	public dreReportFile: string | null;

	@column({
		columnName: "group_nfse_documents",
	})
	public groupNfseDocuments: boolean;

	@column({
		columnName: "overall_resume_type",
	})
	public overallResumeType: "geral" | "mes";

	@column({
		columnName: "ticket_type",
	})
	public ticketType: "venda" | "cliente" | "paciente";

	@column({})
	public reviewer: "S" | "N" | "O";

	@column({
		columnName: "internal_code",
		serializeAs: "internalCode",
	})
	public internalCode: boolean;

	@column({
		columnName: "sync_schedule_movements",
		serializeAs: "syncScheduleMovements",
	})
	public syncScheduleMovements: boolean;

	@column({
		columnName: "sync_crm_schedules",
		serializeAs: "syncCrmSchedules",
	})
	public syncCrmSchedules: boolean;

	@column({
		consume(rawValue) {
			const result = ConfigSchema.safeParse(rawValue);
			if (!result.success) {
				throw new InternalErrorException(
					"Erro buscando informações da unidade, contate o desenvolvedor",
					500,
					"E_ERR",
				);
			}

			return result.data;
		},
		serialize(zodValue: TConfigSchema) {
			return JSON.stringify(zodValue);
		},
	})
	public config: TConfigSchema;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public sale_exit_account_plan_id: string;

	@column({
		serializeAs: null,
	})
	public other_exit_account_plan_id: string;

	@column({
		serializeAs: null,
	})
	public order_entry_account_plan_id: string;

	@column({
		serializeAs: null,
	})
	public other_entry_account_plan_id: string;

	@column({
		serializeAs: null,
	})
	public service_variation_group_id: string;

	@belongsTo(() => VariationGroup, {
		foreignKey: "service_variation_group_id",
	})
	serviceVariationGroup: BelongsTo<typeof VariationGroup>;

	@column({
		serializeAs: null,
	})
	public marketing_account_plan_id: string;

	@column({
		serializeAs: null,
	})
	public incoming_deposit_id: number;

	@column({
		serializeAs: null,
	})
	public outgoing_deposit_id: number;

	@column({
		serializeAs: null,
	})
	public treatment_schedule_service_type_id: string;

	@column({
		serializeAs: null,
	})
	public default_funnel_meta_id: number | null;
}
