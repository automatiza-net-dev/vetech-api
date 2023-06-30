import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Address from 'App/Models/Address';
import PatientContact, { PatientContactType } from 'App/Models/PatientContact';
import SharedService, { AuthContext } from 'App/Services/SharedService';

@inject()
export default class PatientContactService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext, patientId: string) {
    const patient = await authCtx.group
      .related('patients')
      .query()
      .where('patient_id', patientId)
      .preload('contacts')
      .first();

    if (!patient) {
      throw this.sharedService.ResourceNotFound();
    }

    return patient.contacts;
  }

  async store(
    authCtx: AuthContext,
    data: {
      patientId: string;
      main: boolean;
      contact: string;
      observation: string;
      type: typeof PatientContactType[number];
    },
  ) {
    const patient = await authCtx.group
      .related('patients')
      .query()
      .where('patient_id', data.patientId)
      .first();

    if (!patient) {
      throw this.sharedService.ResourceNotFound();
    }

    await patient.related('contacts').create({
      main: data.main,
      contact: data.contact,
      observation: data.observation,
      type: data.type,
    });
  }

  async update(
    authCtx: AuthContext,
    id: number,
    data: {
      main: boolean;
      contact: string;
      observation: string;
      type: typeof PatientContactType[number];
      active: boolean;
    },
  ) {
    await Database.transaction(async trx => {
      const contact = await PatientContact.query()
        .useTransaction(trx)
        .where('id', id)
        .whereHas('patient', query => {
          query.whereHas('economicGroup', query => {
            query.where('economic_group_id', authCtx.group.id);
          });
        })
        .first();

      if (!contact) {
        throw this.sharedService.ResourceNotFound();
      }

      await contact.merge(data).useTransaction(trx).save();
    });
  }

  async destroy(authCtx: AuthContext, id: number) {
    const contact = await PatientContact.query()
      .where('id', id)
      .whereHas('patient', query => {
        query.whereHas('economicGroup', query => {
          query.where('economic_group_id', authCtx.group.id);
        });
      })
      .first();

    if (!contact) {
      throw this.sharedService.ResourceNotFound();
    }

    await contact.delete();
  }
}
