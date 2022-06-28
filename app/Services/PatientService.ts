import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Patient from 'App/Models/Patient';
import IPatientData from 'Contracts/interfaces/IPatientData';
import { v4 } from 'uuid';

@inject()
export default class PatientService {
  public async index(unitId: string): Promise<Array<Patient>> {
    const group = await this.getEconomicGroup(unitId);

    return group.related('patients').query();
  }

  public async store(
    unitId: string,
    data: Omit<IPatientData, 'active'>,
  ): Promise<Patient> {
    const group = await this.getEconomicGroup(unitId);

    const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

    const patient = await Patient.create({
      ...data,
      id: v4(),
      birthDate: data.birthDate.toJSDate(),
      photo,
    });

    await group.related('patients').attach([patient.id]);

    return patient;
  }

  private async getEconomicGroup(unitId: string) {
    const businessUnit = await BusinessUnit.findOrFail(unitId);
    return EconomicGroup.findOrFail(businessUnit.economicGroupId);
  }

  private async uploadPhoto(file: MultipartFileContract): Promise<string> {
    const key = `${v4()}.${file.extname}`;
    await file.moveToDisk(
      'patients',
      {
        name: key,
      },
      'local',
    );

    return Drive.getUrl(`patients/${key}`);
  }
}
