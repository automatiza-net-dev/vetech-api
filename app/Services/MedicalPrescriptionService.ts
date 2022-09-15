import { inject } from '@adonisjs/fold';
import { validator } from '@ioc:Adonis/Core/Validator';
import MedicalPrescription, {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import SharedService from 'App/Services/SharedService';
import IMedicalPrescriptionData, {
  FLUID_ONCE_OR_NEEDED_SCHEMA,
  FLUID_RECURRENT_SCHEMA,
  MEDICATION_ONCE_OR_NEEDED_SCHEMA,
  MEDICATION_RECURRING_SCHEMA,
  PROCEDURE_RECURRING_SCHEMA,
} from 'Contracts/interfaces/IMedicalPrescriptionData';

@inject()
export default class MedicalPrescriptionService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string) {
    return MedicalPrescription.query().where('business_unit_id', unitId);
  }

  public async store(
    unitId: string,
    data: IMedicalPrescriptionData,
    body: Record<string, unknown>,
  ) {
    const schema = this.matchSchema(data.type, data.frequency);

    await validator.validate({
      schema,
      data: body,
    });

    const entity = await MedicalPrescription.create({
      ...data,
      business_unit_id: unitId,
    });

    return entity;
  }

  public async show(unitId: string, id: string) {
    const entity = await MedicalPrescription.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    await Promise.all([
      entity.load('fluidUnit'),
      entity.load('prescriptionUnit'),
      entity.load('drugAdministration'),
    ]);

    return entity;
  }

  public async delete(unitId: string, id: string) {
    const entity = await MedicalPrescription.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    await entity.softDelete();
  }

  private matchSchema(
    type: MedicalPrescriptionType,
    frequency: MedicalPrescriptionFrequency,
  ) {
    if (type === MedicalPrescriptionType.PROCEDURE) {
      // b)
      if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
        return PROCEDURE_RECURRING_SCHEMA;
      }
    }

    if (type === MedicalPrescriptionType.MEDICATION) {
      // c)
      if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
        return MEDICATION_RECURRING_SCHEMA;
      }

      // d)
      return MEDICATION_ONCE_OR_NEEDED_SCHEMA;
    }

    // e)
    if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
      return FLUID_RECURRENT_SCHEMA;
    }

    // f)
    return FLUID_ONCE_OR_NEEDED_SCHEMA;
  }
}
