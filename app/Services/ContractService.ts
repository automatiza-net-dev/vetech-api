import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Patient from "App/Models/Patient";
import PatientContract from "App/Models/PatientContract";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { endOfMonth } from "date-fns";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { validate } from "uuid";

@inject()
export default class ContractService {
	constructor(private sharedService: SharedService) {}

	public async forPatient(authCtx: AuthContext, patientID: string) {
		if (!validate(patientID)) {
			throw new BadRequestException("ID inválido de paciente", 400, "E_ERR");
		}

		const patient = await Patient.query().where("id", patientID).firstOrFail();

		const contracts = await PatientContract.query()
			.preload("product")
			.preload("paymentMethod")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("patient_id", patientID);

		return {
			id: patient.id,
			name: patient.name,
			contracts: contracts.map((row) => ({
				id: row.id,
				product_id: row.product_id,
				product_description: row.product.description,
				product_variation_id: row.product_variation_id,
				business_unit_product_id: row.business_unit_product_id,
				quantity: row.quantity,
				unitary_value: row.unitaryValue,
				promotional_value: row.promotionalValue,
				promotional_value_expiration: row.promotionalValueExpiration,
				payment_method_id: row.payment_method_id,
				payment_method_description: row.paymentMethod.description,
				expiration_day: row.expirationDay,
				active: row.active,
			})),
		};
	}

	public async index(authCtx: AuthContext, data: {}) {
		const rows: {
			economic_group_id: string;
			businness_unit_id: string;
			pid: string;
			pvid: string;
			bupid: string;
			price: string;
		}[] = await Database.from("products")
			.select(
				Database.raw(`products.economic_group_id,
       business_unit_products.businness_unit_id,
       products.id               as pid,
       product_variations.id     as pvid,
       business_unit_products.id as bupid,
       business_unit_products.price`),
			)
			.joinRaw(
				"join product_variations on products.id = product_variations.product_id",
			)
			.joinRaw(
				"join business_unit_products on product_variations.id = business_unit_products.product_variation_id",
			)
			.whereRaw("products.economic_group_id = ?", [authCtx.group.id])
			.whereRaw("products.type = 'service'", [])
			.whereRaw("products.contract in ('S', 'A')", [])
			.whereRaw("products.active is true", [])
			.whereRaw("products.deleted_at is null", [])
			.whereRaw("product_variations.deleted_at is null", [])
			.whereRaw("business_unit_products.deleted_at is null", []);

		return rows.map((r) => ({
			economic_group_id: r.economic_group_id,
			business_unit_id: r.businness_unit_id,
			product_id: r.pid,
			product_variation_id: r.pvid,
			business_unit_product_id: r.businness_unit_id,
			unitary_value: r.price,
		}));
	}

	public async store(
		authCtx: AuthContext,
		data: {
			patientId: string;
			productId: string;
			productVariationId: string;
			businessUnitProductId: string;
			paymentMethodId: string;
			paymentMethodTefFlagId?: string;
			paymentMethodTefAcquirerId?: string;

			quantity: number;
			unitaryValue: number;
			promotionalValue: number;
			promotionalValueExpiration: string;
			expirationDay: number;
		},
	) {
		const [month, year] = data.promotionalValueExpiration.split("/");
		const expiration = endOfMonth(new Date(`${year}/${month}/10`));

		return PatientContract.create({
			economic_group_id: authCtx.group.id,
			business_unit_id: authCtx.unit.id,
			patient_id: data.patientId,
			product_id: data.productId,
			product_variation_id: data.productVariationId,
			business_unit_product_id: data.businessUnitProductId,
			payment_method_id: data.paymentMethodId,
			user_creation_id: authCtx.user.id,
			payment_method_tef_flag_id: data.paymentMethodTefFlagId,
			payment_method_tef_acquirer_id: data.paymentMethodTefAcquirerId,

			quantity: new Decimal(data.quantity),
			unitaryValue: data.unitaryValue,
			promotionalValue: data.promotionalValue,
			promotionalValueExpiration: expiration.toISOString(),
			expirationDay: data.expirationDay,
		});
	}

	public async update(
		authCtx: AuthContext,
		data: {
			id: number;
			paymentMethodId: string;
			paymentMethodTefFlagId?: string;
			paymentMethodTefAcquirerId?: string;

			quantity: number;
			unitaryValue: number;
			promotionalValue: number;
			promotionalValueExpiration: string;
			expirationDay: number;
			active: boolean;
		},
	) {
		return Database.transaction(async (trx) => {
			const existingContract = await PatientContract.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();
			if (!existingContract) {
				throw new ResourceNotFoundException(
					"Contrato não encontrado",
					404,
					"E_ERR",
				);
			}

			const [month, year] = data.promotionalValueExpiration.split("/");
			const expiration = endOfMonth(new Date(`${year}/${month}/10`));

			return existingContract
				.merge({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					payment_method_id: data.paymentMethodId,
					user_updated_id: authCtx.user.id,
					payment_method_tef_flag_id: data.paymentMethodTefFlagId,
					payment_method_tef_acquirer_id: data.paymentMethodTefAcquirerId,

					quantity: new Decimal(data.quantity),
					unitaryValue: data.unitaryValue,
					promotionalValue: data.promotionalValue,
					promotionalValueExpiration: expiration.toISOString(),
					expirationDay: data.expirationDay,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async delete(
		authCtx: AuthContext,
		data: {
			id: number;
		},
	) {
		return Database.transaction(async (trx) => {
			const existingContract = await PatientContract.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.where("business_unit_id", authCtx.unit.id)
				.first();
			if (!existingContract) {
				throw new ResourceNotFoundException(
					"Contrato não encontrado",
					404,
					"E_ERR",
				);
			}

			return existingContract
				.merge({
					user_exclusion_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}
}
