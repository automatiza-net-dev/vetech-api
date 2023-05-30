import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ContactType from 'App/Models/ContactType';

import { userBootstrap, generateJwtToken } from '../utils';

test.group('Contact type resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const contactType = await ContactType.create({
      description: 'Agendado (Confirmado)',
      type: 'crm',
      observation: 'some observation',
    });

    return { user, business, group, contactType };
  };

  test('should get all contact types', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client.get(`/contact-types`).bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create contact type', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .post(`/contact-types`)
      .json({
        description: 'some description',
        type: 'crm',
        observation: 'some observation',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException if no contact was found', async ({
    assert,
    client,
  }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client.get(`/contact-types/0`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should get contact type', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .get(`/contact-types/${props.contactType.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should update contact type', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .put(`/contact-types/${props.contactType.id}`)
      .json({
        description: 'some description',
        type: 'crm',
        observation: 'some observation',
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should delete contact type', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/contact-types/${props.contactType.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
