import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Database from '@ioc:Adonis/Lucid/Database';
import Hospitalization, {
  HospitalizationStatus,
  HospitalizationType,
} from 'App/Models/Hospitalization';
import HospitalizationOccurrence from 'App/Models/HospitalizationOccurrence';
import HospitalizationOccurrenceAttachment from 'App/Models/HospitalizationOccurrenceAttachment';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import Occurrence, {
  OccurrenceType,
  OccurrenceTypeLabels,
} from 'App/Models/Occurrence';
import Patient, { PatientWeightOrigin } from 'App/Models/Patient';
import TimelineType from 'App/Models/TimelineType';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IHospitalizationOccurrenceData, {
  IHospitalizationOccurrenceAttachmentData,
} from 'Contracts/interfaces/IHospitalizationOccurrenceData';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

@inject()
export default class HospitalizationOccurrencesService {
  constructor(private sharedService: SharedService) {}

  public async store(
    authCtx: AuthContext,
    data: Omit<IHospitalizationOccurrenceData, 'active'>,
  ) {
    return Database.transaction(async trx => {
      const hospitalization = await this.getHospitalization(
        authCtx.unit.id,
        data.hospitalizationId,
      );

      const hospAttachments: Array<HospitalizationOccurrenceAttachment> = [];

      const ent = await hospitalization.related('occurrences').create(
        {
          occurrence_id: data.occurrenceId,
          description: data.description,
          executedAt: data.executedAt,
          hospitalization_medical_prescription_id:
            data.hospitalizationMedicalPrescriptionId,
          previewedAt: data.executedAt,
          resume: data.resume,
          user_id: authCtx.user.id,
        },
        {
          client: trx,
        },
      );

      if (data.attachments) {
        const attachments = await Promise.all(
          data.attachments.map(this.uploadFile),
        );

        const createdAttachments = await ent.related('attachments').createMany(
          attachments.map(url => ({
            attachment: url,
          })),
          {
            client: trx,
          },
        );

        createdAttachments.forEach(a => hospAttachments.push(a));
      }

      const occurrence = await Occurrence.findOrFail(data.occurrenceId, {
        client: trx,
      });

      if (occurrence.type === OccurrenceType.OCORRENCIA) {
        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            occurrence: ent.id,
            group: authCtx.group.id,
            unit: authCtx.unit.id,
            origin: 'occurrence',
          },
          data: {
            type: OccurrenceTypeLabels[OccurrenceType.OCORRENCIA],
            realizedAt: data.executedAt,
            issuedAt: DateTime.now(),
            technician: {
              id: authCtx.user.id,
              name: authCtx.user.name,
            },
            description: data.description,
            resume: data.resume,
            attachments: hospAttachments.map(a => a.attachment),
          },
        });
      }

      if (occurrence.type === OccurrenceType.RELATORIO_MEDICO) {
        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            occurrence: ent.id,
            group: authCtx.group.id,
            unit: authCtx.unit.id,
            origin: 'report_occurrence',
          },
          data: {
            type: OccurrenceTypeLabels[OccurrenceType.RELATORIO_MEDICO],
            realizedAt: data.executedAt,
            issuedAt: DateTime.now(),
            technician: {
              id: authCtx.user.id,
              name: authCtx.user.name,
            },
            description: data.description,
            resume: data.resume,
            attachments: hospAttachments.map(a => a.attachment),
          },
        });
      }

      if (occurrence.type === OccurrenceType.OBITO) {
        const patient = await Patient.query()
          .where('id', hospitalization.patient_id)
          .preload('patientAnimal')
          .firstOrFail();
        await patient.patientAnimal
          .merge({
            death: true,
            deathDate: data.executedAt,
          })
          .useTransaction(trx)
          .save();

        await Hospitalization.query()
          .useTransaction(trx)
          .where('patient_id', patient.id)
          .where('status', HospitalizationStatus.ACTIVE)
          .update({
            deathAt: data.executedAt,
          });

        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            occurrence: ent.id,
            group: authCtx.group.id,
            unit: authCtx.unit.id,
            origin: 'death_occurrence',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            realizedAt: data.executedAt,
            issuedAt: DateTime.now(),
            observation: data.resume,
            description: data.description,
            technician: {
              id: authCtx.user.id,
              name: authCtx.user.name,
            },
            attachments: hospAttachments.map(a => a.attachment),
          },
        });

        await HospitalizationTimeline.updateMany(
          {
            'meta.hospitalization': hospitalization.id,
            'meta.type': 'begin_hospitalization',
          },
          {
            $set: {
              'data.deathAt': DateTime.now().toJSDate(),
            },
          },
        );

        const timeline = await TimelineType.firstOrCreate(
          {
            description: SharedService.GetAttendanceLabel(authCtx),
            system_id: authCtx.system.id,
          },
          {
            description: SharedService.GetAttendanceLabel(authCtx),
            color: '#000',
            requiresObservation: false,
            system_id: authCtx.system.id,
          },
          {
            client: trx,
          },
        );

        await AnimalTimeline.create({
          timeline_id: timeline.id,
          timeline_type: {
            description: timeline.description,
            color: timeline.color,
            requires_observation: timeline.requiresObservation,
          },
          timeline_info: {
            tag: hospitalization.patient_id,
            event: 'OBITO',
            realized: DateTime.now().toJSDate(),
            resume: data.resume,
            description: data.description,
            technician: {
              id: authCtx.user.id,
              name: authCtx.user.name,
            },
          },
        });
      }

      if (occurrence.type === OccurrenceType.PESO) {
        const patient = await Patient.findOrFail(hospitalization.patient_id, {
          client: trx,
        });

        await patient
          .merge({
            weight: parseFloat(data.resume),
            weightDate: DateTime.now(),
            weightOrigin: PatientWeightOrigin.I,
          })
          .useTransaction(trx)
          .save();

        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            occurrence: ent.id,
            group: authCtx.group.id,
            unit: authCtx.unit.id,
            origin: 'weight_occurrence',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            realizedAt: data.executedAt,
            issuedAt: DateTime.now(),
            technician: {
              id: authCtx.user.id,
              name: authCtx.user.name,
            },
            description: data.description,
            resume: data.resume,
          },
        });
      }

      if (occurrence.type === OccurrenceType.ALTA_INTERNACAO) {
        const timeline = await TimelineType.firstOrCreate(
          {
            description: SharedService.GetAttendanceLabel(authCtx),
            system_id: authCtx.system.id,
          },
          {
            description: SharedService.GetAttendanceLabel(authCtx),
            color: '#000',
            requiresObservation: false,
            system_id: authCtx.system.id,
          },
          {
            client: trx,
          },
        );

        await AnimalTimeline.create({
          timeline_id: timeline.id,
          timeline_type: {
            description: timeline.description,
            color: timeline.color,
            requires_observation: timeline.requiresObservation,
          },
          timeline_info: {
            tag: hospitalization.patient_id,
            event: 'ALTA',
            realized: DateTime.now(),
            resume: data.resume,
            description: data.description,
            technician: {
              id: authCtx.user.id,
              name: authCtx.user.name,
            },
          },
        });

        await Hospitalization.query()
          .useTransaction(trx)
          .where('patient_id', hospitalization.patient_id)
          .where('status', HospitalizationStatus.ACTIVE)
          .update({
            releasedAt: data.executedAt,
          });

        await HospitalizationTimeline.updateMany(
          {
            'meta.hospitalization': hospitalization.id,
            'meta.type': 'begin_hospitalization',
          },
          {
            $set: {
              'data.releasedAt': DateTime.now().toJSDate(),
              'data.resume': data.resume,
              'data.description': data.description,
            },
          },
        );

        await HospitalizationTimeline.create({
          meta: {
            hospitalization: hospitalization.id,
            occurrence: ent.id,
            group: authCtx.group.id,
            unit: authCtx.unit.id,
            origin: 'hospitalization_release',
          },
          data: {
            tutor: {
              id: hospitalization.tutor.id,
              name: hospitalization.tutor.name,
            },
            patient: {
              id: hospitalization.patient.id,
              name: hospitalization.patient.name,
            },
            technician: {
              id: authCtx.user.id,
              name: authCtx.user.name,
            },
            type: HospitalizationType[hospitalization.type],
            releaseType: data.resume.includes('AO')
              ? 'Alta Indicada'
              : 'Alta Sem Indicação',
            description: data.description,
            resume: data.resume,
          },
        });
      }

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

    const newOccurr = await Occurrence.findOrFail(data.occurrenceId);

    if (
      [
        OccurrenceType.ALTA_INTERNACAO,
        OccurrenceType.ALTA_UTI,
        OccurrenceType.ALTA_OBSERVACAO,
      ].includes(newOccurr.type)
    ) {
      await HospitalizationTimeline.updateMany(
        {
          'meta.hospitalization': hospitalization.id,
          'meta.type': 'begin_hospitalization',
        },
        {
          $set: {
            'data.releasedAt': DateTime.now().toJSDate(),
            'data.resume': data.resume,
            'data.description': data.description,
          },
        },
      );
    }

    return ent
      .merge({
        occurrence_id: data.occurrenceId,
        description: data.description,
        executedAt: data.executedAt,
        hospitalization_medical_prescription_id:
          data.hospitalizationMedicalPrescriptionId,
        previewedAt: data.executedAt,
        resume: data.resume,
        active: data.active,
      })
      .save();
  }

  public async delete(authCtx: AuthContext, id: string) {
    await Database.transaction(async trx => {
      const ent = await HospitalizationOccurrence.query()
        .useTransaction(trx)
        .where('id', id)
        .whereHas('hospitalization', query => {
          query.where('business_unit_id', authCtx.unit.id);
        })
        .preload('hospitalization')
        .preload('occurrence')
        .first();

      if (!ent) {
        throw this.sharedService.ResourceNotFound();
      }

      if (
        [OccurrenceType.OCORRENCIA, OccurrenceType.RELATORIO_MEDICO].includes(
          ent.occurrence.type,
        )
      ) {
        await HospitalizationTimeline.updateMany(
          {
            'meta.occurrence': ent.id,
          },
          {
            $set: {
              'extra.deletedAt': DateTime.now().toJSDate(),
              'extras.user.id': authCtx.user.id,
              'extras.user.name': authCtx.user.name,
              'extras.user.email': authCtx.user.email,
            },
          },
        );
      }

      await ent
        .merge({
          exclusion_user_id: authCtx.user.id,
        })
        .useTransaction(trx)
        .save();

      await ent.softDelete();
    });
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
      .preload('tutor')
      .preload('technician')
      .preload('patient')
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
