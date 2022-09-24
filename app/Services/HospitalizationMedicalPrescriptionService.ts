import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import HospitalizationMedicalPrescription from 'App/Models/HospitalizationMedicalPrescription';
import {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import SharedService from 'App/Services/SharedService';
import CreateFluidOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateFluidOnceOrNeededValidator';
import CreateFluidRecurrentValidator from 'App/Validators/MedicalPrescription/CreateFluidRecurrentValidator';
import CreateMedicationOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateMedicationOnceOrNeededValidator';
import CreateMedicationRecurrentValidator from 'App/Validators/MedicalPrescription/CreateMedicationRecurrentValidator';
import CreateProcedureRecurrentValidator from 'App/Validators/MedicalPrescription/CreateProcedureRecurrentValidator';
import IHospitalizationMedicalPrescriptionData from 'Contracts/interfaces/IHospitalizationMedicalPrescriptionData';

type HospitalizationMedicalPrescriptionKeys = 'PR' | 'MR' | 'FR' | 'F_' | 'M_';

export const HospitalizationMedicalPrescriptionValidation: Record<
  HospitalizationMedicalPrescriptionKeys,
  unknown
> = {
  PR: CreateProcedureRecurrentValidator,
  MR: CreateMedicationRecurrentValidator,
  FR: CreateFluidRecurrentValidator,
  F_: CreateFluidOnceOrNeededValidator,
  M_: CreateMedicationOnceOrNeededValidator,
};

@inject()
export default class HospitalizationMedicalPrescriptionService {
  constructor(private sharedService: SharedService) {}

  public async store(
    data: IHospitalizationMedicalPrescriptionData,
    body: Record<string, unknown>,
  ) {
    const { key } = this.matchSchema(data.type, data.frequency);

    const validatedData: Partial<HospitalizationMedicalPrescription> = {
      hospitalization_id: data.hospitalizationId,
      type: data.type,
      prescribedAt: data.prescribedAt,
      frequency: data.frequency,
      description: data.description,
      resume: data.resume,
      executionStart: data.executionStart,
    };

    if (key === 'PR') {
      return HospitalizationMedicalPrescription.create({
        ...validatedData,
        frequencyInterval: body.frequencyInterval as number,
        frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
        frequencyQuantity: body.frequencyQuantity as number,
        frequencyQuantityUnit:
          body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
      });
    }

    if (key === 'MR') {
      return HospitalizationMedicalPrescription.create({
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
      return HospitalizationMedicalPrescription.create({
        ...validatedData,
        dose: body.dose as number,
        prescription_unit_id: body.prescriptionUnitId as string,
        drug_administration_id: body.drugAdministrationId as string,
      });
    }

    if (key === 'FR') {
      return HospitalizationMedicalPrescription.create({
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
        supplement: body.supplement as string,
      });
    }

    if (key === 'F_') {
      return HospitalizationMedicalPrescription.create({
        ...validatedData,
        dose: body.dose as number,
        prescription_unit_id: body.prescriptionUnitId as string,
        drug_administration_id: body.drugAdministrationId as string,
        fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
        fluidSpeed: body.fluidSpeed as number,
        fluid_unit_id: body.fluidUnitId as string,
        supplement: body.supplement as string,
      });
    }

    throw new BadRequestException('Combinação de tipo e frequência inválida');
  }

  public async update(
    id: string,
    data: IHospitalizationMedicalPrescriptionData,
    body: Record<string, unknown>,
  ) {
    const entity = await HospitalizationMedicalPrescription.query()
      .where('id', id)
      .where('hospitalization_id', data.hospitalizationId)
      .first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    const { key } = this.matchSchema(data.type, data.frequency);

    entity.merge({
      type: data.type,
      prescribedAt: data.prescribedAt,
      frequency: data.frequency,
      description: data.description,
      resume: data.resume,
      executionStart: data.executionStart,
    });

    if (key === 'PR') {
      entity.merge({
        frequencyInterval: body.frequencyInterval as number,
        frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
        frequencyQuantity: body.frequencyQuantity as number,
        frequencyQuantityUnit:
          body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
      });
    }

    if (key === 'MR') {
      entity.merge({
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
      entity.merge({
        dose: body.dose as number,
        prescription_unit_id: body.prescriptionUnitId as string,
        drug_administration_id: body.drugAdministrationId as string,
      });
    }

    if (key === 'FR') {
      entity.merge({
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
        supplement: body.supplement as string,
      });
    }

    if (key === 'F_') {
      entity.merge({
        dose: body.dose as number,
        prescription_unit_id: body.prescriptionUnitId as string,
        drug_administration_id: body.drugAdministrationId as string,
        fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
        fluidSpeed: body.fluidSpeed as number,
        fluid_unit_id: body.fluidUnitId as string,
        supplement: body.supplement as string,
      });
    }

    return entity.save();
  }

  public async delete(id: string) {
    const entity = await HospitalizationMedicalPrescription.query()
      .where('id', id)
      .first();

    if (!entity) {
      throw this.sharedService.ResourceNotFound();
    }

    await entity.softDelete();
  }

  matchSchema(
    type: MedicalPrescriptionType,
    frequency: MedicalPrescriptionFrequency,
  ) {
    if (type === MedicalPrescriptionType.PROCEDURE) {
      // b)
      if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
        return { key: 'PR' };
      }
    }

    if (type === MedicalPrescriptionType.MEDICATION) {
      // c)
      if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
        return { key: 'MR' };
      }

      // d)
      return { key: 'M_' };
    }

    // e)
    if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
      return { key: 'FR' };
    }

    // f)
    return { key: 'F_' };
  }
}
