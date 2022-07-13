import { ApiClient } from '@japa/api-client';
import { LicenceType } from 'App/Models/Licence';
import Role from 'App/Models/Role';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
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

  const group = await user.related('economicGroups').create({
    id: v4(),
    document: user.document,
    responsibleEmail: user.email,
    responsiblePhone: user.phone,
  });

  const business = await group.related('businessUnits').create({
    id: v4(),
    document: user.document,
    phone: user.phone,
    email: user.email,
    origin: 'TESTING',
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

  return { user, group, business, licence, role };
};
