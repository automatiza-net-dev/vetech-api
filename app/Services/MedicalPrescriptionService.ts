import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import MedicalPrescription, {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import CreateFluidOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateFluidOnceOrNeededValidator';
import CreateFluidRecurrentValidator from 'App/Validators/MedicalPrescription/CreateFluidRecurrentValidator';
import CreateMedicationOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateMedicationOnceOrNeededValidator';
import CreateMedicationRecurrentValidator from 'App/Validators/MedicalPrescription/CreateMedicationRecurrentValidator';
import CreateProcedureRecurrentValidator from 'App/Validators/MedicalPrescription/CreateProcedureRecurrentValidator';
import IMedicalPrescriptionData from 'Contracts/interfaces/IMedicalPrescriptionData';

export type MedicalPrescriptionKeys =
  | 'PR'
  | 'PO'
  | 'P_'
  | 'MR'
  | 'FR'
  | 'F_'
  | 'M_';

export const MedicalPrescriptionValidation = {
  PR: CreateProcedureRecurrentValidator,
  PO: CreateProcedureRecurrentValidator,
  P_: CreateProcedureRecurrentValidator,
  MR: CreateMedicationRecurrentValidator,
  FR: CreateFluidRecurrentValidator,
  F_: CreateFluidOnceOrNeededValidator,
  M_: CreateMedicationOnceOrNeededValidator,
};

@inject()
export default class MedicalPrescriptionService {
  constructor(private sharedService: SharedService) {}

  public async index(authCtx: AuthContext) {
    return MedicalPrescription.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('system_id', authCtx.system.id)
      .preload('drugAdministration')
      .preload('prescriptionUnit')
      .preload('fluidUnit');
  }

  public async store(
    authCtx: AuthContext,
    data: IMedicalPrescriptionData,
    body: Record<string, unknown>,
  ) {
    const { key } = this.matchSchema(data.type, data.frequency);

    const validatedData: Partial<MedicalPrescription> = {
      business_unit_id: authCtx.unit.id,
      type: data.type,
      prescribedAt: data.prescribedAt,
      frequency: data.frequency,
      description: data.description,
      resume: data.resume,
      system_id: authCtx.system.id,
    };

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

    if (key === 'PO') {
      return MedicalPrescription.create({
        ...validatedData,
        frequencyInterval: body.frequencyInterval as number,
        frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
        frequencyQuantity: body.frequencyQuantity as number,
        frequencyQuantityUnit:
          body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
      });
    }

    if (key === 'P_') {
      return MedicalPrescription.create({
        ...validatedData,
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
        supplement: body.supplement as string,
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
        supplement: body.supplement as string,
      });
    }

    throw new BadRequestException('Combinação de tipo e frequência inválida');
  }

  public async show(authCtx: AuthContext, id: string) {
    const entity = await MedicalPrescription.query()
      .where('id', id)
      .where('business_unit_id', authCtx.unit.id)
      .where('system_id', authCtx.system.id)
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

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IMedicalPrescriptionData,
    body: Record<string, unknown>,
  ) {
    const entity = await MedicalPrescription.query()
      .where('id', id)
      .where('business_unit_id', authCtx.unit.id)
      .where('system_id', authCtx.system.id)
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

  public async delete(authCtx: AuthContext, id: string) {
    const entity = await MedicalPrescription.query()
      .where('id', id)
      .where('business_unit_id', authCtx.unit.id)
      .where('system_id', authCtx.system.id)
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
