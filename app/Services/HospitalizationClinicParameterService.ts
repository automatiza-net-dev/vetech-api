import { inject } from '@adonisjs/fold';
import ClinicParameter from 'App/Models/ClinicParameter';
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationClinicParameter from 'App/Models/HospitalizationClinicParameter';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { IHospitalizationClinicParameterData } from 'Contracts/interfaces/IHospitalizationClinicParameterData';

@inject()
export default class HospitalizationClinicParameterService {
  constructor(private sharedService: SharedService) {}

  public async store(
    unitId: string,
    user: User,
    data: IHospitalizationClinicParameterData,
  ) {
    const hospitalization = await this.getHospitalization(
      unitId,
      data.hospitalizationId,
    );

    const parameter = await ClinicParameter.findOrFail(data.clinicParameterId);

    await HospitalizationTimeline.create({
      data: {
        hospitalization_id: data.hospitalizationId,
        user: {
          id: user.id,
          name: user.name,
        },
        releasedAt: data.releasedAt,
        executedAt: data.executedAt,
        clinic_parameter: {
          id: parameter.id,
          name: parameter.name,
        },
        resume: data.resume,
        status: data.status,
      },
    });

    return hospitalization.related('parameters').create({
      value: data.value,
      resume: data.resume,
      status: data.status,
      user_id: data.userId ?? user.id,
      clinic_parameter_id: data.clinicParameterId,
      releasedAt: data.releasedAt,
      executedAt: data.executedAt,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: IHospitalizationClinicParameterData,
  ) {
    const hospitalization = await this.getHospitalization(
      unitId,
      data.hospitalizationId,
    );

    const ent = await hospitalization
      .related('parameters')
      .query()
      .where('id', id)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    ent.merge({
      value: data.value,
      resume: data.resume,
      status: data.status,
      user_id: data.userId,
      clinic_parameter_id: data.clinicParameterId,
      releasedAt: data.releasedAt,
      executedAt: data.executedAt,
    });

    return ent.save();
  }

  public async destroy(unitId: string, id: string) {
    const ent = await HospitalizationClinicParameter.query()
      .where('id', id)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    await this.getHospitalization(unitId, ent.hospitalization_id);

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
}
