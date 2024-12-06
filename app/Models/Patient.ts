import {
	BaseModel,
	beforeFetch,
	beforeFind,
	column,
	computed,
	HasMany,
	hasMany,
	HasOne,
	hasOne,
	ManyToMany,
	manyToMany,
} from "@ioc:Adonis/Lucid/Orm";
import EconomicGroup from "App/Models/EconomicGroup";
import PatientAnimal from "App/Models/PatientAnimal";
import PatientTutor from "App/Models/PatientTutor";
import Schedule from "App/Models/Schedule";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";
import { DateTime } from "luxon";
import { v4 } from "uuid";
import Hospitalization from "App/Models/Hospitalization";
import PatientContact from "./PatientContact";
import Bill from "./Bill";

export enum PatientType {
	TUTOR = "tutor",
	ANIMAL = "animal",
	SUPPLIER = "supplier",
}

export enum PatientGender {
	MALE = "macho",
	FEMALE = "femea",
}

export enum TutorGender {
	MALE = "masculino",
	FEMALE = "feminino",
	OTHER = "outro",
}

export enum PatientVaccineOrigin {
	C = "PROPRIA_CLINICA",
	F = "FORA_DA_CLINICA",
	N = "NAO_VACINADO",
}

export enum PatientWeightOrigin {
	A = "ATENDIMENTO",
	I = "INTERNACAO",
}

export default class Patient extends BaseModel {
	@column({ isPrimary: true })
	public id: string = v4();

	@column()
	public tag: string;

	@column()
	public name: string;

	@column()
	public type: PatientType;

	@column()
	public photo?: string;

	@column({
		columnName: "vaccine_origin",
	})
	public vaccineOrigin: PatientVaccineOrigin;

	@column()
	public gender?: PatientGender | TutorGender;

	@column()
	public tags?: string;

	@column({
		columnName: "client_origin_item_description",
	})
	public clientOriginItemDescription?: string;

	@column({
		columnName: "birth_date",
		serializeAs: "birthDate",
	})
	public birthDate?: Date;

	@computed()
	public get birth_date() {
		return this.birthDate;
	}

	@column.dateTime({
		columnName: "first_sale",
	})
	public firstSale?: DateTime;

	@column.dateTime({
		columnName: "last_sale",
	})
	public lastSale?: DateTime;

	@column()
	public weight: number;

	@column.dateTime({
		columnName: "weight_date",
	})
	public weightDate?: DateTime;

	@column({
		columnName: "weight_origin",
	})
	public weightOrigin?: PatientWeightOrigin;

	@column()
	public hypertension: boolean;

	@column()
	public community: boolean;

	@column()
	public diabetes: boolean;

	@column()
	public glycemia: number;

	@column()
	public pressure: string;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({ serializeAs: null })
	public deletedAt: DateTime;

	@beforeFind()
	public static softDeletesFind = softDeleteQuery;

	@beforeFetch()
	public static softDeletesFetch = softDeleteQuery;

	public async softDelete(column?: string) {
		await softDelete(this, column);
	}

	@column({
		serializeAs: null,
	})
	public exclusion_user_id: string;

	@manyToMany(() => EconomicGroup, {
		pivotTable: "patient_economic_groups",
		pivotTimestamps: true,
	})
	public economicGroup: ManyToMany<typeof EconomicGroup>;

	@hasOne(() => PatientTutor, {
		localKey: "id",
		foreignKey: "patient_id",
	})
	public tutor: HasOne<typeof PatientTutor>;

	@manyToMany(() => Patient, {
		pivotTable: "holder_dependents",
		pivotTimestamps: true,
		localKey: "id",
		pivotForeignKey: "dependent_id",
		relatedKey: "id",
		pivotRelatedForeignKey: "holder_id",
		pivotColumns: ["is_main"],
	})
	// eslint-disable-next-line no-use-before-define
	public tutors: ManyToMany<typeof Patient>;

	@manyToMany(() => Patient, {
		pivotTable: "holder_dependents",
		pivotTimestamps: true,
		localKey: "id",
		pivotForeignKey: "holder_id",
		relatedKey: "id",
		pivotRelatedForeignKey: "dependent_id",
		pivotColumns: ["is_main"],
	})
	// eslint-disable-next-line no-use-before-define
	public dependents: ManyToMany<typeof Patient>;

	@hasMany(() => Schedule, {
		localKey: "id",
		foreignKey: "patient_id",
	})
	public schedules: HasMany<typeof Schedule>;

	@hasOne(() => PatientAnimal, {
		localKey: "id",
		foreignKey: "patient_id",
	})
	public patientAnimal: HasOne<typeof PatientAnimal>;

	@hasMany(() => Schedule, {
		localKey: "id",
		foreignKey: "holder_id",
	})
	public holderSchedules: HasMany<typeof Schedule>;

	@hasMany(() => Hospitalization, {
		localKey: "id",
		foreignKey: "patient_id",
	})
	public hospitalizations: HasMany<typeof Hospitalization>;

	@hasMany(() => PatientContact, {
		localKey: "id",
		foreignKey: "patient_id",
	})
	public contacts: HasMany<typeof PatientContact>;

	@hasMany(() => Bill, {
		localKey: "id",
		foreignKey: "client_id",
	})
	public bills: HasMany<typeof Bill>;
}
