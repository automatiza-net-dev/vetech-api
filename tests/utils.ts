import { ApiClient } from "@japa/api-client";
import Deposit from "App/Models/Deposit";
import { LicenceType } from "App/Models/Licence";
import Role from "App/Models/Role";
import System from "App/Models/System";
import SystemUrl from "App/Models/SystemUrl";
import RoleFactory from "Database/factories/RoleFactory";
import UserFactory from "Database/factories/UserFactory";
import { addDays } from "date-fns";
import { v4 } from "uuid";

type LoginType = {
	email: string;
	password: string;
};

export const generateJwtToken = async (
	client: ApiClient,
	data: LoginType & { systemName?: string },
): Promise<string> => {
	const loginResponse = await client.post("/auth/login").json({
		email: data.email,
		password: data.password,
		system: data.systemName ?? "SUT",
	});

	const { token } = loginResponse.body();

	return token;
};

export const createSudo = async (): Promise<[Role]> => {
	const role = await Role.firstOrCreate({ name: "super-admin" }, {});

	return [role];
};

export const userBootstrap = async (system_name = "SUT") => {
	const user = await UserFactory.create();

	const system = await System.firstOrCreate(
		{
			name: system_name,
		},
		{
			name: system_name,
		},
	);
	await SystemUrl.create({
		system_id: system.id,
		url: "http://sut",
	});

	await user
		.merge({
			system_id: system.id,
		})
		.save();

	const group = await user.related("economicGroups").create({
		id: v4(),
		document: user.document,
		responsibleEmail: user.email,
		responsiblePhone: user.phone,
		system_id: system.id,
	});

	const business = await group.related("businessUnits").create({
		id: v4(),
		document: "45370407000149",
		phone: "|PHONE|",
		email: "|EMAIL|",
		fantasyName: "|FANTASY_NAME|",
		companyName: "|COMPANY_NAME|",
		address: "|STREET|",
		number: "|10|",
		district: "|DISTRICT|",
		state: "|STATE|",
		city: "|CITY|",
		postalCode: "|POSTAL_CODE|",
		simple: true,
	});

	const config = await business.related("unitConfig").create({
		controlsDeposit: false,
	});

	const licence = await business.related("licences").create({
		id: v4(),
		active: true,
		expirationDate: addDays(new Date(), 1),
		type: LicenceType.TRIAL,
	});

	const role = await RoleFactory.create();

	await system
		.merge({
			default_role_id: role.id,
		})
		.save();

	const deposit = await Deposit.create({
		business_unit_id: business.id,
		economic_group_id: business.economicGroupId,

		type: "Venda",
		status: "Ativo",
		principal: true,
		description: "Venda",
	});

	await user.related("roles").create({
		role_id: role.id,
		unit_id: business.id,
		default_sale_deposit_id: deposit.id,
	});

	return { user, group, business, licence, role, system, config };
};
