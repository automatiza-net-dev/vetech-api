import { ApiClient } from '@japa/api-client';

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
