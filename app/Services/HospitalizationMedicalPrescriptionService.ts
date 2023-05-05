import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import DrugAdministration from 'App/Models/DrugAdministration';
import Hospitalization, {
  HospitalizationType,
} from 'App/Models/Hospitalization';
import HospitalizationMedicalPrescription from 'App/Models/HospitalizationMedicalPrescription';
import HospitalizationMedicalPrescriptionScheduling, {
  HospitalizationSchedulingStatus,
} from 'App/Models/HospitalizationMedicalPrescriptionScheduling';
import {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFluidSetLabel,
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import Unit from 'App/Models/Unit';
import User from 'App/Models/User';
import { MedicalPrescriptionKeys } from 'App/Services/MedicalPrescriptionService';
import SharedService from 'App/Services/SharedService';
import CreateFluidOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateFluidOnceOrNeededValidator';
import CreateFluidRecurrentValidator from 'App/Validators/MedicalPrescription/CreateFluidRecurrentValidator';
import CreateMedicationOnceOrNeededValidator from 'App/Validators/MedicalPrescription/CreateMedicationOnceOrNeededValidator';
import CreateMedicationRecurrentValidator from 'App/Validators/MedicalPrescription/CreateMedicationRecurrentValidator';
import CreateProcedureRecurrentValidator from 'App/Validators/MedicalPrescription/CreateProcedureRecurrentValidator';
import IHospitalizationMedicalPrescriptionData, {
  IHospitalizationMedicalPrescriptionSchedulingData,
} from 'Contracts/interfaces/IHospitalizationMedicalPrescriptionData';
import { differenceInMinutes, format } from 'date-fns';
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

interface ISearchScheduling {
  hospitalization?: string;
  fromScheduledDate?: string;
  toScheduledDate?: string;
}

@inject()
export default class HospitalizationMedicalPrescriptionService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const query = HospitalizationMedicalPrescription.query()
      .preload('hospitalization', query => {
        query.select('id', 'patient_id', 'technician_id');
        query.preload('patient');
        query.preload('technician');
      })
      .preload('user');

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

  public async schedulingIndex(unitId: string, data: ISearchScheduling) {
    const query = HospitalizationMedicalPrescriptionScheduling.query()
      .preload('hospitalization', query => {
        query.select('id', 'patient_id', 'technician_id');
        query.preload('patient');
        query.preload('technician');
      })
      .preload('technician');

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

    if (data.fromScheduledDate) {
      query.where('scheduled_at', '>=', new Date(data.fromScheduledDate));
    }

    if (data.toScheduledDate) {
      query.where('scheduled_at', '<=', new Date(data.toScheduledDate));
    }

    return query;
  }

  public async store(
    data: IHospitalizationMedicalPrescriptionData,
    body: Record<string, unknown>,
    unitId: string,
    user: User,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);
    const { key } = this.matchSchema(data.type, data.frequency);

    return Database.transaction(async trx => {
      const hospitalization = await Hospitalization.query()
        .where('id', data.hospitalizationId)
        .firstOrFail();

      const validatedData: Partial<HospitalizationMedicalPrescription> = {
        hospitalization_id: data.hospitalizationId,
        type: data.type,
        prescribedAt: data.prescribedAt,
        frequency: data.frequency,
        description: data.description,
        resume: data.resume,
        executionStart: data.executionStart,
        user_id: data.userId,
        volume: data.volume,
      };

      if (key === 'PR') {
        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'prescription',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            issuedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
            prescription_type: 'Procedimento',
            frequency: data.frequency,
            frequencyUnit: body.frequencyUnit,
            frequencyQuantityUnit: body.frequencyQuantityUnit,
            executionStart: data.executionStart,
            description: data.description,
            resume: data.resume,
            volume: data.volume ?? null,
          },
        });

        return HospitalizationMedicalPrescription.create({
          ...validatedData,
          frequencyInterval: body.frequencyInterval as number,
          frequencyUnit: body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
          frequencyQuantity: body.frequencyQuantity as number,
          frequencyQuantityUnit:
            body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
        });
      }

      if (key === 'PO') {
        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'prescription',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            issuedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
            prescription_type: 'Procedimento',
            frequencyType: data.frequency,
            frequencyUnit: body.frequencyUnit,
            frequencyQuantityUnit: body.frequencyQuantityUnit,
            executionStart: data.executionStart,
            description: data.description,
            resume: data.resume,
            fluidSet: body.fluidSet,
            fluidSpeed: body.fluidSpeed as number,
            dose: body.dose as number,
            supplement: body.supplement as string,
            volume: data.volume ?? null,
          },
        });

        return HospitalizationMedicalPrescription.create(
          {
            ...validatedData,
            dose: body.dose as number,
            prescription_unit_id: body.prescriptionUnitId as string,
            drug_administration_id: body.drugAdministrationId as string,
            fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
            fluidSpeed: body.fluidSpeed as number,
            fluid_unit_id: body.fluidUnitId as string,
            supplement: body.supplement as string,
          },
          {
            client: trx,
          },
        );
      }

      if (key === 'P_') {
        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'prescription',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            issuedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
            prescription_type: 'Procedimento',
            frequencyType: data.frequency,
            frequencyUnit: body.frequencyUnit,
            frequencyQuantityUnit: body.frequencyQuantityUnit,
            executionStart: data.executionStart,
            description: data.description,
            resume: data.resume,
            fluidSet: body.fluidSet,
            fluidSpeed: body.fluidSpeed as number,
            dose: body.dose as number,
            supplement: body.supplement as string,
            volume: data.volume ?? null,
          },
        });

        return HospitalizationMedicalPrescription.create(
          {
            ...validatedData,
            dose: body.dose as number,
            prescription_unit_id: body.prescriptionUnitId as string,
            drug_administration_id: body.drugAdministrationId as string,
            fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
            fluidSpeed: body.fluidSpeed as number,
            fluid_unit_id: body.fluidUnitId as string,
            supplement: body.supplement as string,
          },
          {
            client: trx,
          },
        );
      }

      if (key === 'MR') {
        const drug = await DrugAdministration.query()
          .where('id', body.drugAdministrationId as string)
          .useTransaction(trx)
          .firstOrFail();

        const unit = await Unit.query()
          .where('id', body.prescriptionUnitId as string)
          .useTransaction(trx)
          .firstOrFail();

        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'prescription',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            issuedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
            prescription_type: 'Medicamento',
            frequency: data.frequency,
            frequencyUnit: body.frequencyUnit,
            frequencyQuantityUnit: body.frequencyQuantityUnit,
            executionStart: data.executionStart,
            description: data.description,
            resume: data.resume,
            drug: drug.description,
            dose: body.dose as number,
            unit: unit.name,
            volume: data.volume ?? null,
          },
        });

        return HospitalizationMedicalPrescription.create(
          {
            ...validatedData,
            frequencyInterval: body.frequencyInterval as number,
            frequencyUnit:
              body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
            frequencyQuantity: body.frequencyQuantity as number,
            frequencyQuantityUnit:
              body.frequencyQuantityUnit as MedicalPrescriptionFrequencyQuantityUnit,
            dose: body.dose as number,
            prescription_unit_id: body.prescriptionUnitId as string,
            drug_administration_id: body.drugAdministrationId as string,
          },
          {
            client: trx,
          },
        );
      }

      if (key === 'M_') {
        const drug = await DrugAdministration.query()
          .where('id', body.drugAdministrationId as string)
          .useTransaction(trx)
          .firstOrFail();

        const unit = await Unit.query()
          .where('id', body.prescriptionUnitId as string)
          .useTransaction(trx)
          .firstOrFail();

        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'prescription',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            issuedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
            prescription_type: 'Medicamento',
            frequency: {
              type: data.frequency,
              unit: body.frequencyUnit,
              quantity: body.frequencyQuantityUnit,
            },
            executionStart: data.executionStart,
            description: data.description,
            resume: data.resume,
            drug: drug.description,
            dose: body.dose as number,
            unit: unit.name,
            volume: data.volume ?? null,
          },
        });

        return HospitalizationMedicalPrescription.create(
          {
            ...validatedData,
            dose: body.dose as number,
            prescription_unit_id: body.prescriptionUnitId as string,
            drug_administration_id: body.drugAdministrationId as string,
          },
          {
            client: trx,
          },
        );
      }

      if (key === 'FR') {
        const drug = await DrugAdministration.query()
          .where('id', body.drugAdministrationId as string)
          .useTransaction(trx)
          .firstOrFail();

        const unit = await Unit.query()
          .where('id', body.prescriptionUnitId as string)
          .useTransaction(trx)
          .firstOrFail();

        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'prescription',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            issuedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
            prescription_type: 'Fluidoterapia',
            frequencyType: data.frequency,
            frequencyUnit: body.frequencyUnit,
            frequencyQuantityUnit: body.frequencyQuantityUnit,
            executionStart: data.executionStart,
            description: data.description,
            resume: data.resume,
            fluidSet: body.fluidSet,
            fluidSpeed: body.fluidSpeed as number,
            drug: drug.description,
            dose: body.dose as number,
            unit: unit.name,
            supplement: body.supplement as string,
            volume: data.volume ?? null,
          },
        });

        return HospitalizationMedicalPrescription.create(
          {
            ...validatedData,
            frequencyInterval: body.frequencyInterval as number,
            frequencyUnit:
              body.frequencyUnit as MedicalPrescriptionFrequencyUnit,
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
          },
          {
            client: trx,
          },
        );
      }

      if (key === 'F_') {
        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            group: group.id,
            unit: unitId,
            origin: 'prescription',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            issuedAt: DateTime.now(),
            technician: {
              id: user.id,
              name: user.name,
            },
            prescription_type: 'Fluidoterapia',
            frequencyType: data.frequency,
            frequencyUnit: body.frequencyUnit,
            frequencyQuantityUnit: body.frequencyQuantityUnit,
            executionStart: data.executionStart,
            description: data.description,
            resume: data.resume,
            fluidSet: body.fluidSet,
            fluidSpeed: body.fluidSpeed as number,
            dose: body.dose as number,
            supplement: body.supplement as string,
            volume: data.volume ?? null,
          },
        });

        return HospitalizationMedicalPrescription.create(
          {
            ...validatedData,
            dose: body.dose as number,
            prescription_unit_id: body.prescriptionUnitId as string,
            drug_administration_id: body.drugAdministrationId as string,
            fluidSet: body.fluidSet as MedicalPrescriptionFluidSet,
            fluidSpeed: body.fluidSpeed as number,
            fluid_unit_id: body.fluidUnitId as string,
            supplement: body.supplement as string,
          },
          {
            client: trx,
          },
        );
      }

      throw new BadRequestException(
        'Combinação de tipo e frequência inválida',
        400,
        'E_INVALID',
      );

      // await HospitalizationTimeline.create({
      //   meta: {
      //     hospitalization: hospitalization.id,
      //     group: group.id,
      //     unit: unitId,
      //   },
      //   type: HospitalizationType[hospitalization.type],
      //   hospitalizedAt: hospitalization.createdAt,
      //   realizedAt: data.executedAt,
      //   issuedAt: DateTime.now(),
      //   technician: {
      //     id: user.id,
      //     name: user.name,
      //   },
      //   attachments: ent.attachments.map(a => a.attachment),
      // });
    });
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
      observationOnExecution: data.observationOnExecution,
      volume: data.volume,
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
    const scheduling =
      await HospitalizationMedicalPrescriptionScheduling.query()
        .where('id', id)
        .preload('hospitalization')
        .preload('prescription')
        .first();

    if (!scheduling) {
      throw this.sharedService.ResourceNotFound();
    }

    if (scheduling.executedAt) {
      throw new BadRequestException('Agendamento já executado', 400, 'E_ERR');
    }

    await Database.transaction(async trx => {
      await scheduling
        .merge({
          description: data.description,
          resume: data.resume,
          executedAt: DateTime.now(),
          scheduledAt: data.scheduledAt,
          prescribedAt: data.executedAt,
          status: data.status,
          type: data.type,
          frequency: data.frequency,
          user_id: user.id,
        })
        .useTransaction(trx)
        .save();

      await HospitalizationTimeline.create({
        meta: {
          hospitalization: scheduling.hospitalization_id,
          group: scheduling.hospitalization.economic_group_id,
          unit: scheduling.hospitalization.business_unit_id,
          origin: 'scheduling_execution',
        },
        data: {
          type: HospitalizationType[scheduling.hospitalization.type],
          hospitalizedAt: scheduling.hospitalization.createdAt,
          scheduledAt: data.scheduledAt,
          executedAt: data.executedAt,
          issuedAt: DateTime.now(),
          technician: {
            id: user.id,
            name: user.name,
          },
          description: data.description,
          resume: data.resume,
          prescription: scheduling.prescription.description,
          prescription_type: data.type,
        },
      });
    });
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
  ): { key: MedicalPrescriptionKeys } {
    if (type === MedicalPrescriptionType.PROCEDURE) {
      // b)
      if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
        return { key: 'PR' } as const;
      }

      if (frequency === MedicalPrescriptionFrequency.ONCE) {
        return { key: 'PO' } as const;
      }

      return { key: 'P_' } as const;
    }

    if (type === MedicalPrescriptionType.MEDICATION) {
      // c)
      if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
        return { key: 'MR' } as const;
      }

      // d)
      return { key: 'M_' } as const;
    }

    // e)
    if (frequency === MedicalPrescriptionFrequency.RECURRENT) {
      return { key: 'FR' } as const;
    }

    // f)
    return { key: 'F_' } as const;
  }

  async createScheduling(
    prescription: HospitalizationMedicalPrescription,
    user: User,
  ) {
    await prescription.load('hospitalization');

    if (prescription.frequency === MedicalPrescriptionFrequency.WHEN_NEEDED) {
      return;
    }

    const resume = await this.createResume(prescription);

    if (prescription.frequency === MedicalPrescriptionFrequency.ONCE) {
      await prescription.related('scheduling').create({
        type: prescription.type,
        frequency: prescription.frequency,
        resume,
        scheduledAt: prescription.executionStart,
        hospitalization_id: prescription.hospitalization_id,
        status: HospitalizationSchedulingStatus.ACTIVE,
        user_id: user.id,
      });

      return;
    }

    const offset =
      prescription.frequencyUnit === MedicalPrescriptionFrequencyUnit.DAY
        ? 60 * 24
        : 60;

    const diff =
      differenceInMinutes(
        this.calculateEndDate(prescription),
        prescription.prescribedAt.toJSDate(),
      ) /
      offset /
      prescription.frequencyInterval;

    const data: Array<Partial<HospitalizationMedicalPrescriptionScheduling>> =
      Array.from<Partial<HospitalizationMedicalPrescriptionScheduling>>({
        length: Math.ceil(diff),
      }).map((_, index) => {
        const scheduledAt =
          prescription.frequencyUnit === MedicalPrescriptionFrequencyUnit.HOUR
            ? prescription.executionStart.plus({
                hours: prescription.frequencyInterval * index,
              })
            : prescription.executionStart.plus({
                days: prescription.frequencyInterval * index,
              });

        return {
          type: prescription.type,
          frequency: prescription.frequency,
          resume,
          scheduledAt,
          status: HospitalizationSchedulingStatus.ACTIVE,
          hospitalization_id: prescription.hospitalization_id,
          user_id: user.id,
        };
      });

    await prescription.related('scheduling').createMany(data);
  }

  async createResume(prescription: HospitalizationMedicalPrescription) {
    if (prescription.type === MedicalPrescriptionType.PROCEDURE) {
      return prescription.description;
    }

    await prescription.load('drugAdministration');
    await prescription.load('prescriptionUnit');
    await prescription.load('hospitalization');
    await prescription.load('hospitalization', query => {
      query.preload('patient');
    });

    if (prescription.type === MedicalPrescriptionType.MEDICATION) {
      return [
        prescription.description,
        [prescription.dose, prescription.prescriptionUnit.name].join(' '),
        `volume: ${prescription.volume}`,
        `via de aplicação: ${
          prescription.drugAdministration?.description ?? '-'
        }`,
        `(${prescription.hospitalization.patient.weight ?? ''} ${
          prescription.hospitalization.patient.weightDate
            ? [
                'kg em ',
                format(
                  prescription.hospitalization.patient.weightDate?.toJSDate(),
                  'dd/MM/yyyy HH:mm',
                ),
              ].join(' ')
            : 'Não informado'
        })`,
      ]
        .filter(Boolean)
        .join(', ');
    }

    await prescription.load('fluidUnit');

    // XX, XX, XX, XX, Macro-Gotas, XX, XX
    return [
      prescription.description,
      `${prescription.dose} ${prescription.fluidUnit.name}`,
      `volume: ${prescription.volume}`,
      `via aplicação: ${prescription.drugAdministration.description}`,
      MedicalPrescriptionFluidSetLabel[prescription.fluidSet],
      `${prescription.fluidSpeed} ${prescription.fluidUnit?.name}`,
      prescription.supplement,
    ]
      .filter(Boolean)
      .join(', ');
  }

  calculateEndDate(prescription: HospitalizationMedicalPrescription) {
    if (
      prescription.frequencyQuantityUnit ===
      MedicalPrescriptionFrequencyQuantityUnit.DAY
    ) {
      return prescription.prescribedAt
        .plus({ days: prescription.frequencyQuantity })
        .toJSDate();
    }

    if (
      prescription.frequencyQuantityUnit ===
      MedicalPrescriptionFrequencyQuantityUnit.HOUR
    ) {
      return prescription.prescribedAt
        .plus({ hours: prescription.frequencyQuantity })
        .toJSDate();
    }

    return prescription.prescribedAt.toJSDate();
  }
}
