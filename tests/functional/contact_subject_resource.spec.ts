import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ContactSubject from 'App/Models/ContactSubject';

import { userBootstrap, generateJwtToken } from '../utils';

test.group('Contact type resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const contactSubject = await ContactSubject.create({
      description: 'Agendado (Confirmado)',
      type: 'crm',
    });

    return { user, business, group, contactSubject };
  };

  test('should get all contact subjects', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client.get(`/contact-subjects`).bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create contact subject', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .post(`/contact-subjects`)
      .json({
        description: 'some description',
        type: 'crm',
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

    const response = await client.get(`/contact-subjects/0`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should get contact subject', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .get(`/contact-subjects/${props.contactSubject.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should update contact subject', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .put(`/contact-subjects/${props.contactSubject.id}`)
      .json({
        description: 'some description',
        type: 'crm',
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should delete contact subject', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/contact-subjects/${props.contactSubject.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
