import {
	BaseModel,
	BelongsTo,
	belongsTo,
	column,
	HasMany,
	hasMany,
	HasOne,
	hasOne,
} from "@ioc:Adonis/Lucid/Orm";
import Attendance from "App/Models/Attendance";
import BusinessUnitAcquirer from "App/Models/BusinessUnitAcquirer";
import BusinessUnitConfig from "App/Models/BusinessUnitConfig";
import BusinessUnitProduct from "App/Models/BusinessUnitProduct";
import CheckingAccount from "App/Models/CheckingAccount";
import EconomicGroup from "App/Models/EconomicGroup";
import Invite from "App/Models/Invite";
import Licence from "App/Models/Licence";
import Schedule from "App/Models/Schedule";
import UnavailableDay from "App/Models/UnavailableDay";
import WorkingDay from "App/Models/WorkingDay";
import { DateTime } from "luxon";
import { v4 } from "uuid";

export const BusinessUnitEnvironment = ["P", "H"] as const;
export type TBusinessUnitEnvironment = (typeof BusinessUnitEnvironment)[number];

export const UnitStatus = ["Ativa", "Inativa", "Consulta", "Excluida"] as const;
export type TUnitStatus = (typeof UnitStatus)[number];

export default class BusinessUnit extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public identification?: string;

	@column()
	public email?: string;

	@column({
		columnName: "fantasy_name",
	})
	public fantasyName?: string;

	@column({
		columnName: "company_name",
	})
	public companyName?: string;

	@column()
	public environment: TBusinessUnitEnvironment;

	@column({
		columnName: "city_code",
	})
	public cityCode?: string;

	@column()
	public document?: string;

	@column()
	public phone?: string;

	@column()
	public origin?: string;

	@column({
		columnName: "postal_code",
	})
	public postalCode?: string;

	@column()
	public address?: string;

	@column()
	public number?: string;

	@column()
	public complement?: string;

	@column()
	public district?: string;

	@column()
	public city?: string;

	@column()
	public state?: string;

	@column()
	public active?: boolean;

	@column()
	public lat?: boolean;

	@column()
	public lng?: boolean;

	@column({
		columnName: "state_registration",
	})
	public stateRegistration?: string;

	@column({
		columnName: "city_registration",
	})
	public cityRegistration?: string;

	@column()
	public cnae?: string;

	@column()
	public simple: boolean;

	@column()
	public status: TUnitStatus;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		columnName: "economic_group_id",
		serializeAs: null,
	})
	public economicGroupId: string;

	@column({
		serializeAs: null,
	})
	public system_id: number;

	@column({
		serializeAs: null,
	})
	public patient_id: string | null;

	@belongsTo(() => EconomicGroup, {})
	public economicGroup: BelongsTo<typeof EconomicGroup>;

	@hasMany(() => Invite, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public invites: HasMany<typeof Invite>;

	@hasMany(() => Licence, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public licences: HasMany<typeof Licence>;

	@hasMany(() => Schedule, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public schedules: HasMany<typeof Schedule>;

	@hasMany(() => WorkingDay, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public workingDays: HasMany<typeof WorkingDay>;

	@hasMany(() => UnavailableDay, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public unavailableDays: HasMany<typeof UnavailableDay>;

	@hasMany(() => BusinessUnitProduct, {
		localKey: "id",
		foreignKey: "businness_unit_id",
	})
	public businessUnitProducts: HasMany<typeof BusinessUnitProduct>;

	@hasMany(() => Attendance, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public Attendances: HasMany<typeof Attendance>;

	@hasMany(() => CheckingAccount, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public checkingAccounts: HasMany<typeof CheckingAccount>;

	@hasMany(() => BusinessUnitAcquirer, {
		localKey: "id",
		foreignKey: "business_unit_id",
	})
	public acquirers: HasMany<typeof BusinessUnitAcquirer>;

	@hasOne(() => BusinessUnitConfig, {
		foreignKey: "business_unit_id",
	})
	public unitConfig: HasOne<typeof BusinessUnitConfig>;
}
