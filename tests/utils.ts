import { ApiClient } from '@japa/api-client';
import { LicenceType } from 'App/Models/Licence';
import Role from 'App/Models/Role';
import System from 'App/Models/System';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { SERVICE_VARIATION_GROUP_ID } from 'Database/seeders/ServiceSeeder';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

type LoginType = {
  email: string;
  password: string;
};

export const generateJwtToken = async (
  client: ApiClient,
  data: LoginType,
): Promise<string> => {
  const loginResponse = await client.post('/auth/login').json({
    email: data.email,
    password: data.password,
  });
  const { token } = loginResponse.body();
  return token;
};

export const createSudo = async (): Promise<[Role]> => {
  const role = await Role.firstOrCreate({ name: 'super-admin' }, {});

  return [role];
};

export const userBootstrap = async () => {
  const user = await UserFactory.create();

  const system = await System.create({
    name: v4(),
  });

  const group = await user.related('economicGroups').create({
    id: v4(),
    document: user.document,
    responsibleEmail: user.email,
    responsiblePhone: user.phone,
    system_id: system.id,
  });

  const business = await group.related('businessUnits').create({
    id: v4(),
    document: '45370407000149',
    phone: '|PHONE|',
    email: '|EMAIL|',
    fantasyName: '|FANTASY_NAME|',
    companyName: '|COMPANY_NAME|',
    address: '|STREET|',
    number: '|10|',
    district: '|DISTRICT|',
    state: '|STATE|',
    city: '|CITY|',
    postalCode: '|POSTAL_CODE|',
    simple: true,
  });

  await business.related('unitConfig').create({
    service_variation_group_id: SERVICE_VARIATION_GROUP_ID,
  });

  const licence = await business.related('licences').create({
    id: v4(),
    active: true,
    expirationDate: addDays(new Date(), 1),
    type: LicenceType.TRIAL,
  });

  const role = await RoleFactory.create();

  await user.related('roles').create({
    role_id: role.id,
    unit_id: business.id,
  });

  return { user, group, business, licence, role, system };
};
