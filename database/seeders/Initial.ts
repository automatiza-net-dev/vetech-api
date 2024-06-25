import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import { LicenceType } from "App/Models/Licence";
import Plan from "App/Models/Plan";
import Role from "App/Models/Role";
import System from "App/Models/System";
import User from "App/Models/User";
import { addDays } from "date-fns";
import { v4 } from "uuid";

export default class extends BaseSeeder {
	public async run() {
		const [admin] = await User.fetchOrCreateMany("email", [
			{
				name: "Germano",
				email: "dev@liftone.com.br",
				password: "102030",
			},
		]);

		const defaultSystem = await System.firstOrCreate(
			{
				name: "LiftOne",
			},
			{
				name: "LiftOne",
			},
		);

		const newGroup = await admin.related("economicGroups").create({
			id: v4(),
			system_id: defaultSystem.id,
		});

		const newBusinessUnit = await newGroup.related("businessUnits").create({
			id: v4(),
			origin: "SEED",
		});

		const [superAdminRole] = await Role.fetchOrCreateMany("name", [
			{
				name: "super_admin",
			},
			{
				name: "admin",
			},
		]);

		// const [fullPermission] = await Permission.fetchOrCreateMany('description', [
		//   {
		//     name: 'description',
		//   },
		// ]);

		// await superAdminRole.related('permissions').sync([fullPermission.id]);

		await admin.related("roles").firstOrCreate(
			{ role_id: superAdminRole.id },
			{
				role_id: superAdminRole.id,
				unit_id: newBusinessUnit.id,
			},
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
		);

		await newBusinessUnit.related("licences").create({
			id: v4(),
			expirationDate: addDays(new Date(), 9999),
			type: LicenceType.TRIAL,
			active: true,
		});
	}
}
