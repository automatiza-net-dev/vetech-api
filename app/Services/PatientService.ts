import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
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

  public async show(unitId: string, patientId: string): Promise<Patient> {
    const group = await this.getEconomicGroup(unitId);

    const patient = await group
      .related('patients')
      .query()
      .where('patient_id', patientId)
      .first();

    if (!patient) {
      throw new ResourceNotFoundException(
        'Paciente não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return patient;
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

  public async update(
    unitId: string,
    id: string,
    data: IPatientData,
  ): Promise<Patient> {
    const patient = await this.show(unitId, id);

    const photo = data.photo
      ? await this.uploadPhoto(data.photo)
      : patient.photo;

    return patient
      .merge({
        name: data.name,
        type: data.type,
        photo,
        gender: data.gender,
        tags: data.tags,
        birthDate: data.birthDate.toJSDate(),
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, patientId: string): Promise<void> {
    const group = await this.getEconomicGroup(unitId);
    const patient = await this.show(unitId, patientId);
    const groups = await patient.related('economicGroup').query();

    await patient.related('economicGroup').detach([group.id]);

    if (groups.length > 1) {
      return;
    }

    await patient.softDelete();
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
