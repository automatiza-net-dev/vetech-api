import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationMedicalPrescription from 'App/Models/HospitalizationMedicalPrescription';
import HospitalizationMedicalPrescriptionScheduling, {
  HospitalizationSchedulingStatus,
} from 'App/Models/HospitalizationMedicalPrescriptionScheduling';
import {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import { WEIGHT_UUID } from 'App/Models/TimelineType';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import CreateFluidOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateFluidOnceOrNeededValidator';
import CreateFluidRecurrentValidator from 'App/Validators/MedicalPrescription/CreateFluidRecurrentValidator';
import CreateMedicationOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateMedicationOnceOrNeededValidator';
import CreateMedicationRecurrentValidator from 'App/Validators/MedicalPrescription/CreateMedicationRecurrentValidator';
import CreateProcedureRecurrentValidator from 'App/Validators/MedicalPrescription/CreateProcedureRecurrentValidator';
import IHospitalizationMedicalPrescriptionData, {
  IHospitalizationMedicalPrescriptionSchedulingData,
} from 'Contracts/interfaces/IHospitalizationMedicalPrescriptionData';
import { addMinutes, differenceInMinutes, format } from 'date-fns';
import { DateTime } from 'luxon';

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

interface ISearch {
  hospitalization?: string;
  fromExecutionDate?: string;
  toExecutionDate?: string;
}
@inject()
export default class HospitalizationMedicalPrescriptionService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const query = HospitalizationMedicalPrescription.query().preload(
      'hospitalization',
      query => {
        query.select('id', 'patient_id');
        query.preload('patient');
        query.preload('technician');
      },
    );

    if (data.hospitalization) {
      query.where('hospitalization_id', data.hospitalization);
    } else {
      const hospitalizations = await Hospitalization.query()
        .where('business_unit_id', unitId)
        .select('id');

      query.whereIn(
        'hospitalization_id',
        hospitalizations.map(h => h.id),
      );
    }

    if (data.fromExecutionDate) {
      query.where('execution_start', '>=', new Date(data.fromExecutionDate));
    }

    if (data.toExecutionDate) {
      query.where('execution_start', '<=', new Date(data.toExecutionDate));
    }

    return query;
  }

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
      user_id: data.userId,
    };

    await HospitalizationTimeline.create({
      data: {
        hospitalization_id: data.hospitalizationId,
        type: data.type,
        prescribedAt: data.prescribedAt,
        executionStart: data.executionStart,
        frequency: data.frequency,
        resume: data.resume,
        description: data.description,
        active: true,
      },
    });

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
      user_id: data.userId,
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

  public async updateScheduling(
    id: string,
    user: User,
    data: IHospitalizationMedicalPrescriptionSchedulingData,
  ) {
    const scheduling = await HospitalizationMedicalPrescriptionScheduling.find(
      id,
    );

    if (!scheduling) {
      throw this.sharedService.ResourceNotFound();
    }

    await scheduling
      .merge({
        description: data.description,
        resume: data.resume,
        executedAt: data.executedAt,
        scheduledAt: data.scheduledAt,
        status: data.status,
        type: data.type,
        frequency: data.frequency,
      })
      .save();

    if (data.executedAt) {
      await HospitalizationTimeline.create({
        data: {
          hospitalization_id: scheduling.hospitalization_id,
          user: {
            id: user.id,
            name: user.name,
          },
          type: scheduling.type,
          frequency: scheduling.frequency,
          executedAt: scheduling.executedAt,
          scheduledAt: scheduling.scheduledAt,
          description: scheduling.description,
          resume: scheduling.resume,
          status: scheduling.status,
        },
      });
    }
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

  async createScheduling(
    prescription: HospitalizationMedicalPrescription,
    user: User,
  ) {
    await prescription.load('hospitalization');

    const rawDifference = differenceInMinutes(
      prescription.hospitalization.expectedDischarge.toJSDate(),
      prescription.executionStart.toJSDate(),
    );

    if (rawDifference < 0) {
      throw new BadRequestException(
        'A data de início da execução não pode ser maior que a data de alta esperada',
      );
    }

    if (prescription.frequency === MedicalPrescriptionFrequency.WHEN_NEEDED) {
      return;
    }

    const description = await this.createDescription(prescription);

    if (prescription.frequency === MedicalPrescriptionFrequency.ONCE) {
      await prescription.related('scheduling').create({
        type: prescription.type,
        frequency: prescription.frequency,
        description,
        resume: prescription.resume,
        scheduledAt: prescription.executionStart,
        hospitalization_id: prescription.hospitalization_id,
        status: HospitalizationSchedulingStatus.ACTIVE,
        user_id: user.id,
      });
    }

    const offset =
      prescription.frequencyUnit === MedicalPrescriptionFrequencyUnit.DAY
        ? 60 * 24
        : 60;
    const parsedDifference = rawDifference / offset;

    const data: Array<Partial<HospitalizationMedicalPrescriptionScheduling>> =
      Array.from<Partial<HospitalizationMedicalPrescriptionScheduling>>({
        length: parsedDifference,
      }).map((_, index) => {
        return {
          type: prescription.type,
          frequency: prescription.frequency,
          description,
          resume: prescription.resume,
          scheduledAt: DateTime.fromJSDate(
            addMinutes(prescription.executionStart.toJSDate(), index * offset),
          ),
          status: HospitalizationSchedulingStatus.ACTIVE,
          hospitalization_id: prescription.hospitalization_id,
          user_id: user.id,
        };
      });

    await prescription.related('scheduling').createMany(data);
  }

  async createDescription(prescription: HospitalizationMedicalPrescription) {
    if (prescription.type === MedicalPrescriptionType.PROCEDURE) {
      return prescription.description;
    }

    await prescription.load('drugAdministration');
    await prescription.load('hospitalization');
    const [lastWeight] = await AnimalTimeline.find({
      'timeline_info.tag': prescription.hospitalization.patient_id,
      timeline_id: WEIGHT_UUID,
    });

    if (prescription.type === MedicalPrescriptionType.MEDICATION) {
      return `${prescription.description}, ${prescription.dose}, ${
        prescription.drugAdministration?.description
      } (${(lastWeight?.timeline_info as any)?.weight ?? ''} kg em ${format(
        (lastWeight as any).createdAt,
        'dd/MM/yyyy HH:mm',
      )})`;
    }

    await prescription.load('fluidUnit');

    return `${prescription.description}, ${prescription.fluidSpeed} ${
      prescription.fluidUnit?.name ?? ''
    }, ${prescription.dose}, ${prescription.supplement ?? ''} (${
      (lastWeight?.timeline_info as any)?.weight ?? ''
    } kg em ${format((lastWeight as any).createdAt, 'dd/MM/yyyy HH:mm')})`;
  }
}
