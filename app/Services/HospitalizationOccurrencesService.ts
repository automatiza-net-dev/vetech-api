import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationOccurrence from 'App/Models/HospitalizationOccurrence';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IHospitalizationOccurrenceData from 'Contracts/interfaces/IHospitalizationOccurrenceData';
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

    const ent = await hospitalization.related('occurrences').create({
      occurrence_id: data.occurrenceId,
      description: data.description,
      executedAt: data.executedAt,
      hospitalization_medical_prescription_id:
        data.hospitalizationMedicalPrescriptionId,
      previewedAt: data.previewedAt,
      resume: data.resume,
      user_id: user.id,
    });

    if (data.attachments) {
      const attachments = await Promise.all(
        data.attachments.map(this.uploadFile),
      );

      await ent.related('attachments').createMany(
        attachments.map(url => ({
          attachment: url,
        })),
      );
    }

    return ent;
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
