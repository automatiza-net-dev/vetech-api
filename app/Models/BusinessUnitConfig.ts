import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import VariationGroup from "App/Models/VariationGroup";
import { DateTime } from "luxon";
import * as z from "zod";
import BusinessUnit from "./BusinessUnit";

export const ConfigCrmSchema = z.object({
	crm_useful_days: z.boolean().optional().nullable(),
	default_funnel_meta_id: z.number().optional().nullable(),
});

export const ConfigBillSchema = z.object({
	sale_exit_account_plan_id: z.string().uuid().optional().nullable(),
	other_exit_account_plan_id: z.string().uuid().optional().nullable(),
	requires_bill_patient: z.boolean().optional().nullable(),
	generate_treatment_opened_bill: z.boolean().optional().nullable(),
});

export const ConfigReceiptSchema = z.object({
	order_entry_account_plan_id: z.string().uuid().optional().nullable(),
	other_entry_account_plan_id: z.string().uuid().optional().nullable(),
	generate_finances_on_receipt_finish: z.boolean().optional().nullable(),
});

export const ConfigProductSchema = z.object({
	service_variation_group_id: z.string().uuid().optional().nullable(),
});

export const ConfigFiscalDocumentSchema = z.object({
	fiscal_document_environment: z.string().optional().nullable(),
	focus_homologation_token: z.string().optional().nullable(),
	focus_production_token: z.string().optional().nullable(),
	xml_download_authorization: z.string().optional().nullable(),
	group_nfse_documents: z.boolean().optional().nullable(),
	default_nfse_description: z.string().optional().nullable(),
});

export const ConfigSchedulesSchema = z.object({
	allow_change_schedule_duration: z.boolean().optional().nullable(),
	interval: z.number().optional().nullable(),
	show_treatment_executions_schedule: z.boolean().optional().nullable(),
	show_treatment_schedules: z.boolean().optional().nullable(),
	treatment_schedule_service_type_id: z.string().uuid().optional().nullable(),
	return_interval: z.number().optional().nullable(),
	allowed_return_qty: z.number().optional().nullable(),
	schedule_late_minutes: z.number().optional().nullable(),
	schedule_missed_minutes: z.number().optional().nullable(),
	integrates_to_crm_schedules: z.boolean().optional().nullable(),
	sync_schedule_movements: z.boolean().optional().nullable(),
	sync_schedules_crm: z.boolean().optional().nullable(),
});

export const ConfigBusinessUnitsSchema = z.object({
	patient_dependent: z.boolean().optional().nullable(),
	locked_daily_movement_date: z.boolean().optional().nullable(),
	daily_cashier_type: z
		.union([z.literal("geral"), z.literal("usuario")])
		.optional()
		.nullable(),
	requires_finance_client: z.boolean().optional().nullable(),
	marketing_account_plan_id: z.string().uuid().optional().nullable(),
	incoming_deposit_id: z.coerce.number().optional().nullable(),
	outgoing_deposit_id: z.coerce.number().optional().nullable(),
	balance_control: z
		.union([
			z.literal("realizado"),
			z.literal("usuario"),
			z.literal("previsto"),
		])
		.optional()
		.nullable(),
	controls_deposit: z.boolean().optional().nullable(),
	requires_client_document: z.boolean().optional().nullable(),
	alter_prices: z.boolean().optional().nullable(),
	dashboard_lists_retroactive_schedules: z.boolean().optional().nullable(),
	dre_report_file: z.string().optional().nullable(),
	useful_days: z.boolean().optional().nullable(),
	treatment: z.boolean().optional().nullable(),
	overall_resume_type: z
		.union([z.literal("geral"), z.literal("mes")])
		.optional()
		.nullable(),
	ticket_type: z
		.union([z.literal("venda"), z.literal("cliente"), z.literal("paciente")])
		.optional()
		.nullable(),
	reviewer: z
		.union([z.literal("S"), z.literal("N"), z.literal("O")])
		.optional()
		.nullable(),
	internal_code: z.boolean().optional().nullable(),
});

export const ConfigBudgetSchema = z.object({
	budgets_payments_required: z.boolean().optional().nullable(),
});

export const ConfigTreatmentSchema = z.object({
	minimum_percentage_paid_start_treatment: z.boolean().optional().nullable(),
});

export const ConfigSchema = z.object({
	crm: z.optional(ConfigCrmSchema),
	bills: z.optional(ConfigBillSchema),
	receipts: z.optional(ConfigReceiptSchema),
	products: z.optional(ConfigProductSchema),
	fiscalDocuments: z.optional(ConfigFiscalDocumentSchema),
	schedules: z.optional(ConfigSchedulesSchema),
	businessUnits: z.optional(ConfigBusinessUnitsSchema),
	budgets: z.optional(ConfigBudgetSchema),
	treatments: z.optional(ConfigTreatmentSchema),
});

const baseFieldSchema = z.object({
	title: z.string(),
	required: z.boolean(),
	type: z
		.literal("string")
		.or(z.literal("date"))
		.or(z.literal("object"))
		.or(z.literal("array")),
	error_message: z.string().optional(),
});

const fieldWithPropsSchema = baseFieldSchema.extend({
	prop: z.array(
		z.object({
			title: z.string(),
			key: z.string(),
			required: z.boolean(),
			type: z
				.literal("string")
				.or(z.literal("date"))
				.or(z.literal("object"))
				.or(z.literal("array")),
		}),
	),
});

const fieldSchema = z.union([baseFieldSchema, fieldWithPropsSchema]);

const shapeSchema = z.record(fieldSchema);

export const FormValidatorSchema = z.record(shapeSchema);

export type TConfigSchema = z.infer<typeof ConfigSchema>;
export type TDynamicForm = z.infer<typeof FormValidatorSchema>;

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
	public allowChangeScheduleDuration: boolean;

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
		// consume(rawValue) {
		// 	const result = ConfigSchema.safeParse(rawValue);
		// 	if (!result.success) {
		// 		axiom.ingest(Env.get("AXIOM_DATASET"), [
		// 			{
		// 				_type: "$config-error",
		// 				origin: "business-unit-config",
		// 				errors: result.error.flatten(),
		// 			},
		// 		]);
		// 		axiom.flush().catch((err) => {
		// 			console.error(err);
		// 		});
		//
		// 		throw new InternalErrorException(
		// 			"Erro buscando informações da unidade, contate o desenvolvedor",
		// 			500,
		// 			"E_ERR",
		// 		);
		// 	}
		//
		// 	return result.data;
		// },
		// serialize(zodValue: TConfigSchema) {
		// 	return JSON.stringify(zodValue);
		// },
	})
	public config: TConfigSchema;

	@column({
		columnName: "form_fields",
		serializeAs: "formFields",
		consume(rawValue) {
			return FormValidatorSchema.parse(rawValue);
		},
		serialize(zodValue: TDynamicForm) {
			return JSON.stringify(zodValue);
		},
	})
	public formFields: TDynamicForm;

	@column({
		columnName: "budgets_payments_required",
		serializeAs: "budgetsPaymentsRequired",
	})
	public budgetsPaymentsRequired: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@belongsTo(() => BusinessUnit, {
		foreignKey: "business_unit_id",
	})
	businessUnit: BelongsTo<typeof BusinessUnit>;

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
