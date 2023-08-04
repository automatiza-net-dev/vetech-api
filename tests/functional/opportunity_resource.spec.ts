import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Activity from 'App/Models/Activity';
import ClientOrigin, { ClientOriginType } from 'App/Models/ClientOrigin';
import ContactSubject from 'App/Models/ContactSubject';
import ContactType from 'App/Models/ContactType';
import CrmStatus from 'App/Models/CrmStatus';
import Opportunity from 'App/Models/Opportunity';
import OpportunityActivity from 'App/Models/OpportunityActivity';
import { PatientType } from 'App/Models/Patient';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';

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

    const someActivity = await Activity.create({
      description: 'Agendado (Confirmado)',
      type: 'crm',
      duration: 10,
    });

    const holder = await PatientFactory.create();
    await holder.merge({ type: PatientType.TUTOR }).save();

    const origin = await ClientOrigin.create({
      description: 'some description',
      type: ClientOriginType.C,
      economic_group_id: group.id,
      system_id: system.id,
    });

    const opportunity = await Opportunity.create({
      system_id: system.id,
      business_unit_id: business.id,
      economic_group_id: group.id,
      opening_user_id: user.id,
      user_id: user.id,
      client_id: holder.id,
      contact_id: holder.id,
      status_id: crmStatus.id,
      contact_type_id: contactType.id,
      contact_subject_id: contactSubject.id,
      client_origin_id: origin.id,
      openingDate: DateTime.now(),
      contactDate: DateTime.now(),
      description: 'some',
      observation: 'some',
      value: 10,
    });

    const activity = await OpportunityActivity.create({
      opportunity_id: opportunity.id,
      opening_user_id: user.id,
      user_id: user.id,

      issueDate: DateTime.now(),
      executionDate: DateTime.now(),
      duration: 10,
      description: 'some',
      status: 'Aberta',
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
      opportunity,
      activity,
      someActivity,
    };
  };

  test('should throw NotFoundException if no opportunity was found', async props => {
    const { user } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });
    const response = await props.client
      .get(`/opportunities/show/${-1}`)
      .bearerToken(token);

    props.assert.equal(response.status(), 404);
  });

  test('should show opportunity', async props => {
    const { user, opportunity } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });
    const response = await props.client
      .get(`/opportunities/show/${opportunity.id}`)
      .bearerToken(token);

    props.assert.equal(response.status(), 200);
  });

  test('should search for opportunities', async props => {
    const { user, business } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const params = new URLSearchParams({
      openingFrom: new Date().toISOString(),
      openingTo: new Date().toISOString(),
      contactFrom: new Date().toISOString(),
      contactTo: new Date().toISOString(),
      contactName: 'some',
      contactPhone: 'some',
      patientName: 'some',
      technician: user.id,
      unit: business.id,
    });

    const response = await props.client
      .get(`/opportunities/search?${params.toString()}`)
      .bearerToken(token);

    props.assert.equal(response.status(), 200);
  });

  test('should search for opportunities (kanban)', async props => {
    const { user, business } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const params = new URLSearchParams({
      openingFrom: new Date().toISOString(),
      openingTo: new Date().toISOString(),
      contactName: 'some',
      patientName: 'some',
      technician: user.id,
      unit: business.id,
    });

    const response = await props.client
      .get(`/opportunities/search-kanban?${params.toString()}`)
      .bearerToken(token);

    props.assert.equal(response.status(), 200);
  });

  test('should search for activities (kanban)', async props => {
    const { user } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const params = new URLSearchParams({
      activity: '1',
      opportunity: '1',
    });

    const response = await props.client
      .get(`/opportunities/search-kanban-activities?${params.toString()}`)
      .bearerToken(token);

    props.assert.equal(response.status(), 200);
  });

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

  test('should create an opportunity activity', async props => {
    const { user, opportunity, someActivity } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const response = await props.client
      .post('/opportunities/create-activity')
      .json({
        opportunityId: opportunity.id,
        userId: user.id,
        activityId: someActivity.id,

        executionDate: new Date(),
        description: 'some description',
        duration: 10,
      })
      .bearerToken(token);

    props.assert.equal(response.status(), 204);
  });

  test('should execute an opportunity activity', async props => {
    const { user, activity } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const response = await props.client
      .post(`/opportunities/execute-activity/${activity.id}`)
      .json({
        observation: 'some observation',
      })
      .bearerToken(token);

    props.assert.equal(response.status(), 204);
  });

  test('should update an opportunity activity', async props => {
    const { user, activity, someActivity } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const response = await props.client
      .post(`/opportunities/update-activity`)
      .json({
        id: activity.id,
        userId: user.id,
        activityId: someActivity.id,

        executionDate: new Date(),
        description: 'some description',
        duration: 10,
      })
      .bearerToken(token);

    props.assert.equal(response.status(), 204);
  });

  test('should cancel an opportunity activity', async props => {
    const { user, activity } = await createData();

    const token = await generateJwtToken(props.client, {
      email: user.email,
      password: '102030',
    });

    const response = await props.client
      .post(`/opportunities/cancel-activity/${activity.id}`)
      .json({
        observation: 'some observation',
      })
      .bearerToken(token);

    props.assert.equal(response.status(), 204);
  });
});
