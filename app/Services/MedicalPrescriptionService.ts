import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import { validator } from '@ioc:Adonis/Core/Validator';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import MedicalPrescription, {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
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
    return MedicalPrescription.query()
      .where('business_unit_id', unitId)
      .preload('drugAdministration')
      .preload('prescriptionUnit')
      .preload('fluidUnit');
  }

  public async store(
    unitId: string,
    data: IMedicalPrescriptionData,
    body: Record<string, unknown>,
  ) {
    const { key, schema } = this.matchSchema(data.type, data.frequency);

    const validatedData: Partial<MedicalPrescription> = {
      business_unit_id: unitId,
      name: data.name,
      type: data.type,
      prescribedAt: data.prescribedAt,
      frequency: data.frequency,
      description: data.description,
      resume: data.resume,
    };

    try {
      await validator.validate({
        schema,
        data: body,
      });

      if (key === 'PR') {
        return MedicalPrescription.create({
          ...validatedData,
          frequencyInterval: body.frequencyInterval as number,
          frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
          frequencyQuantity: body.frequencyQuantity as number,
          frequencyQuantityUnit:
            body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
        });
      }

      if (key === 'MR') {
        return MedicalPrescription.create({
          ...validatedData,
          frequencyInterval: body.frequencyInterval as number,
          frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
          frequencyQuantity: body.frequencyQuantity as number,
          frequencyQuantityUnit:
            body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
          dose: body.dose as number,
          prescription_unit_id: body.prescriptionUnitId as string,
          drug_administration_id: body.drugAdministrationId as string,
        });
      }

      if (key === 'M_') {
        return MedicalPrescription.create({
          ...validatedData,
          dose: body.dose as number,
          prescription_unit_id: body.prescriptionUnitId as string,
          drug_administration_id: body.drugAdministrationId as string,
        });
      }

      if (key === 'FR') {
        return MedicalPrescription.create({
          ...validatedData,
          frequencyInterval: body.frequencyInterval as number,
          frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
          frequencyQuantity: body.frequencyQuantity as number,
          frequencyQuantityUnit:
            body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
          dose: body.dose as number,
          prescription_unit_id: body.prescriptionUnitId as string,
          drug_administration_id: body.drugAdministrationId as string,
          fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
          fluidSpeed: body.fluidSpeed as number,
          fluid_unit_id: body.fluidUnitId as string,
          suplement: body.suplement as string,
        });
      }

      if (key === 'F_') {
        return MedicalPrescription.create({
          ...validatedData,
          dose: body.dose as number,
          prescription_unit_id: body.prescriptionUnitId as string,
          drug_administration_id: body.drugAdministrationId as string,
          fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
          fluidSpeed: body.fluidSpeed as number,
          fluid_unit_id: body.fluidUnitId as string,
          suplement: body.suplement as string,
        });
      }

      throw new BadRequestException('Tipo e Frequência não combinam');
    } catch (error) {
      Logger.error(error.message);

      throw new InternalErrorException('Erro ao criar prescrição médica');
    }
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
        return { key: 'PR', schema: PROCEDURE_RECURRING_SCHEMA };
      }
    }

    if (type === MedicalPrescriptionType.MEDICATION) {
      // c)
      if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
        return { key: 'MR', schema: MEDICATION_RECURRING_SCHEMA };
      }

      // d)
      return { key: 'M_', schema: MEDICATION_ONCE_OR_NEEDED_SCHEMA };
    }

    // e)
    if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
      return { key: 'FR', schema: FLUID_RECURRENT_SCHEMA };
    }

    // f)
    return { key: 'F_', schema: FLUID_ONCE_OR_NEEDED_SCHEMA };
  }
}
