import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Database from '@ioc:Adonis/Lucid/Database';
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationOccurrence from 'App/Models/HospitalizationOccurrence';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';
import TimelineType, {
  HOSPITALIZATION_UUID,
  WEIGHT_UUID,
} from 'App/Models/TimelineType';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IHospitalizationOccurrenceData, {
  IHospitalizationOccurrenceAttachmentData,
} from 'Contracts/interfaces/IHospitalizationOccurrenceData';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

@inject()
export default class HospitalizationOccurrencesService {
  constructor(private sharedService: SharedService) {}

  public async store(
    unitId: string,
    user: User,
    data: Omit<IHospitalizationOccurrenceData, 'active'>,
  ) {
    const hospitalization = await this.getHospitalization(
      unitId,
      data.hospitalizationId,
    );

    return Database.transaction(async trx => {
      const ent = await hospitalization.related('occurrences').create(
        {
          occurrence_id: data.occurrenceId,
          description: data.description,
          executedAt: data.executedAt,
          hospitalization_medical_prescription_id:
            data.hospitalizationMedicalPrescriptionId,
          previewedAt: data.previewedAt,
          resume: data.resume,
          user_id: user.id,
        },
        {
          client: trx,
        },
      );

      if (data.attachments) {
        const attachments = await Promise.all(
          data.attachments.map(this.uploadFile),
        );

        await ent.related('attachments').createMany(
          attachments.map(url => ({
            attachment: url,
          })),
          {
            client: trx,
          },
        );
      }

      const occurrence = await Occurrence.findOrFail(data.occurrenceId, {
        client: trx,
      });
      if (occurrence.type === OccurrenceType.PESO) {
        const timelineInfo = await TimelineType.findOrFail(WEIGHT_UUID, {
          client: trx,
        });

        await AnimalTimeline.create({
          timeline_id: WEIGHT_UUID,
          timeline_type: {
            description: timelineInfo.description,
            color: timelineInfo.color,
            requires_observation: timelineInfo.requiresObservation,
          },
          timeline_info: {
            weight: data.resume,
            tag: hospitalization.patient_id,
            realizedAt: data.executedAt,
            technician: {
              id: user.id,
              name: user.name,
            },
          },
        });
      }

      if (
        [
          OccurrenceType.ALTA_INTERNACAO,
          OccurrenceType.ALTA_OBSERVACAO,
          OccurrenceType.ALTA_UTI,
          OccurrenceType.OBITO,
          OccurrenceType.PESO,
          OccurrenceType.RELATORIO_MEDICO,
          OccurrenceType.OCORRENCIA,
        ].includes(occurrence.type)
      ) {
        await HospitalizationTimeline.create({
          data: {
            hospitalization_id: hospitalization.id,
            type: {
              id: occurrence.id,
              description: occurrence.description,
            },
            user: {
              id: user.id,
              name: user.name,
            },
            previewedAt: data.previewedAt,
            executedAt: data.executedAt,
            resume: data.resume,
            description: data.description,
            active: true,
          },
        });
      }

      const timelineInfo = await TimelineType.findOrFail(HOSPITALIZATION_UUID, {
        client: trx,
      });

      await AnimalTimeline.create({
        timeline_id: HOSPITALIZATION_UUID,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: hospitalization.patient_id,
          hospitalization: {
            id: hospitalization.id,
            type: hospitalization.type,
          },
          complaint: hospitalization.complaint,
          bed: {
            id: hospitalization.bed?.id,
            name: hospitalization.bed?.name,
            tag: hospitalization.bed?.tag,
          },
          hospitalizedAt: hospitalization.createdAt,
          completedAt: DateTime.now(),
          technician: {
            id: user.id,
            name: user.name,
          },
        },
      });

      return ent;
    });
  }

  public async storeAttachments(
    unitId: string,
    data: IHospitalizationOccurrenceAttachmentData,
  ) {
    const ent = await HospitalizationOccurrence.find(data.occurrenceId);

    await ent?.load('hospitalization');

    if (!ent || ent.hospitalization?.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    const attachments = await Promise.all(
      data.attachments.map(this.uploadFile),
    );

    await ent.related('attachments').createMany(
      attachments.map(url => ({
        attachment: url,
      })),
    );
  }

  public async update(
    unitId: string,
    id: string,
    data: IHospitalizationOccurrenceData,
  ) {
    const hospitalization = await this.getHospitalization(
      unitId,
      data.hospitalizationId,
    );

    const ent = await hospitalization
      .related('occurrences')
      .query()
      .where('id', id)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent
      .merge({
        occurrence_id: data.occurrenceId,
        description: data.description,
        executedAt: data.executedAt,
        hospitalization_medical_prescription_id:
          data.hospitalizationMedicalPrescriptionId,
        previewedAt: data.previewedAt,
        resume: data.resume,
        active: data.active,
      })
      .save();
  }

  public async delete(unitId: string, id: string) {
    const ent = await HospitalizationOccurrence.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    await ent.load('hospitalization');

    if (ent.hospitalization.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    await ent.softDelete();
  }

  public async deleteAttachment(
    unitId: string,
    id: string,
    attachment: string,
  ) {
    const ent = await HospitalizationOccurrence.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    await ent.load('hospitalization');

    if (ent.hospitalization.business_unit_id !== unitId) {
      throw this.sharedService.ResourceNotFound();
    }

    const attachmentEnt = await ent
      .related('attachments')
      .query()
      .where('id', attachment)
      .first();

    if (!attachmentEnt) {
      throw this.sharedService.ResourceNotFound();
    }

    await attachmentEnt.softDelete();
  }

  private async getHospitalization(unitId: string, hospitalizationId: string) {
    const hospitalization = await Hospitalization.query()
      .where('id', hospitalizationId)
      .where('business_unit_id', unitId)
      .first();

    if (!hospitalization) {
      throw this.sharedService.ResourceNotFound();
    }

    return hospitalization;
  }

  private async uploadFile(file: MultipartFileContract): Promise<string> {
    const key = `${v4()}.${file.extname}`;
    await file.moveToDisk(
      'hospitalizations',
      {
        name: key,
      },
      'local',
    );

    return Drive.getUrl(`hospitalizations/${key}`);
  }
}
