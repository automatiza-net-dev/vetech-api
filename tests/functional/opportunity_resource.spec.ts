import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ClientOrigin, { ClientOriginType } from 'App/Models/ClientOrigin';
import ContactSubject from 'App/Models/ContactSubject';
import ContactType from 'App/Models/ContactType';
import CrmStatus from 'App/Models/CrmStatus';
import { PatientType } from 'App/Models/Patient';
import PatientFactory from 'Database/factories/PatientFactory';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Opportunity resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group, system } = await userBootstrap();

    const contactType = await ContactType.create({
      description: 'Agendado (Confirmado)',
      type: 'crm',
      observation: 'some observation',
    });

    const contactSubject = await ContactSubject.create({
      description: 'Agendado (Confirmado)',
      type: 'crm',
    });

    const crmStatus = await CrmStatus.create({
      description: 'Agendado (Confirmado)',
      type: 'OP',
      tag: 'some tag',
    });

    const holder = await PatientFactory.create();
    await holder.merge({ type: PatientType.TUTOR }).save();

    const origin = await ClientOrigin.create({
      description: 'some description',
      type: ClientOriginType.C,
      economic_group_id: group.id,
      system_id: system.id,
    });

    return {
      user,
      business,
      group,
      contactType,
      contactSubject,
      holder,
      origin,
      crmStatus,
    };
  };

  test('should create an opportunity', async props => {
    const { user, holder, origin, contactType, contactSubject, crmStatus } =
      await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const response = await props.client
      .post('/opportunities')
      .json({
        userId: user.id,
        clientId: holder.id,
        contactId: holder.id,
        statusId: crmStatus.id,
        contactTypeId: contactType.id,
        contactSubjectId: contactSubject.id,
        originId: origin.id,

        contactDate: new Date(),
        description: 'some description',
        observation: 'some observation',
        value: 100,
      })
      .bearerToken(token);

    props.assert.equal(response.status(), 201);
  });
});
