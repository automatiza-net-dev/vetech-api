import Database from "@ioc:Adonis/Lucid/Database";
import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import Deposit from "App/Models/Deposit";
import { LicenceType } from "App/Models/Licence";
import Plan from "App/Models/Plan";
import Role from "App/Models/Role";
import System from "App/Models/System";
import User from "App/Models/User";
import { addDays } from "date-fns";
import { v4 } from "uuid";
import { SERVICE_VARIATION_GROUP_ID } from "./ServiceSeeder";

export default class extends BaseSeeder {
	public async run() {
		await Database.transaction(async (trx) => {
			const defaultSystem = await System.firstOrCreate(
				{
					name: "LiftOne",
				},
				{
					name: "LiftOne",
				},

				{
					client: trx,
				},
			);

			const [admin] = await User.fetchOrCreateMany(
				"email",
				[
					{
						system_id: defaultSystem.id,
						name: "Germano",
						email: "germano@dev.com",
						password: "102030",
					},
				],
				{
					client: trx,
				},
			);

			const newGroup = await admin.related("economicGroups").create(
				{
					id: v4(),
					system_id: defaultSystem.id,
				},
				{},
				{
					client: trx,
				},
			);

			const newBusinessUnit = await newGroup.related("businessUnits").create(
				{
					id: v4(),
					origin: "SEED",
				},
				{
					client: trx,
				},
			);

			const deposit = await Deposit.create(
				{
					economic_group_id: newGroup.id,
					business_unit_id: newBusinessUnit.id,
					description: "Deposito Central / Almoxarifado",
					type: "Venda",
					status: "Ativo",
					principal: true,
				},
				{
					client: trx,
				},
			);

			await newBusinessUnit.related("unitConfig").create(
				{
					service_variation_group_id: SERVICE_VARIATION_GROUP_ID,
					incoming_deposit_id: deposit.id,
					outgoing_deposit_id: deposit.id,
				},
				{
					client: trx,
				},
			);

			const [superAdminRole] = await Role.fetchOrCreateMany(
				"name",
				[
					{
						name: "super_admin",
						type: "user",
						system_id: defaultSystem.id,
					},
					{
						name: "admin",
						type: "user",
						system_id: defaultSystem.id,
					},
				],
				{ client: trx },
			);

			await admin.related("roles").firstOrCreate(
				{ role_id: superAdminRole.id },
				{
					role_id: superAdminRole.id,
					unit_id: newBusinessUnit.id,
				},
				{ client: trx },
			);

			await Plan.firstOrCreate(
				{
					default: true,
				},
				{
					default: true,
					id: v4(),
					description: "Plano padrão",
					trialDays: 9999,
					trialAdditional: 9999,
				},
				{ client: trx },
			);

			await newBusinessUnit.related("licences").create(
				{
					id: v4(),
					expirationDate: addDays(new Date(), 9999),
					type: LicenceType.TRIAL,
					active: true,
				},
				{ client: trx },
			);
		});
	}
}
