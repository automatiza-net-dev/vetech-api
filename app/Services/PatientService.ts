import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Patient, { PatientGender, PatientType } from 'App/Models/Patient';
import IAssignPatientTutor from 'Contracts/interfaces/IAssignPatientTutor';
import IPatientData from 'Contracts/interfaces/IPatientData';
import IPatientTutorData from 'Contracts/interfaces/IPatientTutorData';
import ISearchPatient from 'Contracts/interfaces/ISearchPatient';
import { v4 } from 'uuid';

interface ISearch {
  name?: string;
  gender?: PatientGender;
  type?: PatientType;
}

interface ISearchAnimals {
  name?: string;
  tutor?: string;
  race?: string;
}

interface ISearchTutor {
  name?: string;
  document?: string;
  phone?: string;
  patient?: string;
  race?: string;
}

@inject()
export default class PatientService {
  public async index(unitId: string, data: ISearch): Promise<Array<Patient>> {
    const group = await this.getEconomicGroup(unitId);

    const qb = group.related('patients').query();

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.gender) {
      qb.where('gender', data.gender);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    return qb;
  }

  public async tutorsIndex(
    unitId: string,
    data: ISearchTutor,
  ): Promise<Array<Patient>> {
    const group = await this.getEconomicGroup(unitId);

    const qb = group
      .related('patients')
      .query()
      .where('type', PatientType.TUTOR)
      .preload('tutor', query => {
        query.whereILike('document', `%${data.document ?? ''}`);
        query.whereILike('cellphone', `%${data.phone ?? ''}`);
      })
      .preload('dependents', query => {
        query.preload('patientAnimal', subquery => {
          subquery.preload('race', subsubquery => {
            subsubquery.whereILike('description', `%${data.race ?? ''}`);
          });
        });
      });

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.patient) {
      qb.whereHas('dependents', query => {
        query.where('name', 'ilike', `%${data.patient}%`);
      });
    }

    const result = await qb;

    return result.filter(model => {
      if (data.document && !model.tutor) {
        return false;
      }
      if (data.phone && !model.tutor) {
        return false;
      }

      if (data.race && !model.patientAnimal.race) {
        return false;
      }

      return true;
    });
  }

  public async animalsIndex(
    unitId: string,
    data: ISearchAnimals,
  ): Promise<Array<Patient>> {
    const group = await this.getEconomicGroup(unitId);

    const qb = group
      .related('patients')
      .query()
      .where('type', PatientType.ANIMAL)
      .preload('tutors', query => {
        query.whereILike('name', `%${data.tutor ?? ''}%`);
        query.preload('tutor');
      })
      .preload('patientAnimal', query => {
        query.preload('race', subquery => {
          subquery.whereILike('description', `%${data.race ?? ''}%`);
        });
      });

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    const result = await qb;

    return result.filter(model => {
      if (data.race && !model.patientAnimal?.race) {
        return false;
      }

      return model.tutors.length >= 0;
    });
  }

  public async search(unitId: string, data: ISearchPatient) {
    const group = await this.getEconomicGroup(unitId);

    const tutors = await group
      .related('patients')
      .query()
      .where('type', PatientType.TUTOR)
      .andWhereILike('name', `%${data.tutor ?? ''}%`)
      .preload('dependents', query => {
        query.whereILike('name', `%${data.patient ?? ''}%`);
      })
      .select(['id']);

    return tutors.map(t => t.dependents).flat();
  }

  public async tutorNonPatients(unitId: string, id: string) {
    const tutor = await this.show(unitId, id);
    const animalsIndex = await this.animalsIndex(unitId, {});

    const dependents = tutor.dependents.map(d => d.id);

    return animalsIndex.filter(f => !dependents.includes(f.id));
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

    if (patient.type === PatientType.TUTOR) {
      await patient.load('tutor');
      await patient.load('dependents');
    }

    if (patient.type === PatientType.ANIMAL) {
      await patient.load('tutors');
      await patient.load('patientAnimal');
    }

    return patient;
  }

  public async store(
    unitId: string,
    data: Omit<IPatientData, 'active'>,
  ): Promise<Patient> {
    const group = await this.getEconomicGroup(unitId);
    const holder = await Patient.findOrFail(data.holderId);

    if (holder.type !== PatientType.TUTOR) {
      throw new BadRequestException('Tutor inválido', 400, 'E_BAD_REQUEST');
    }
    const trx = await Database.transaction();

    try {
      const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

      const patient = await Patient.create(
        {
          name: data.name,
          gender: data.gender,
          tags: data.tags,
          birthDate: data.birthDate?.toJSDate(),
          type: PatientType.ANIMAL,
          photo,
        },
        {
          client: trx,
        },
      );

      await holder.related('dependents').attach([patient.id], trx);

      await group.related('patients').attach([patient.id], trx);

      await patient.related('patientAnimal').create(
        {
          race_id: data.raceId,
        },
        trx,
      );

      await trx.commit();

      return patient;
    } catch (e) {
      Logger.error(e.message);
      await trx.rollback();

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }

  public async storeTutor(
    unitId: string,
    data: Omit<IPatientTutorData, 'active'>,
  ): Promise<Patient> {
    const group = await this.getEconomicGroup(unitId);

    const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

    const trx = await Database.transaction();

    try {
      const patient = await Patient.create(
        {
          name: data.name,
          birthDate: data.birthDate?.toJSDate(),
          gender: data.gender,
          tags: data.tags,
          photo,
          type: PatientType.TUTOR,
        },
        { client: trx },
      );

      await patient.related('tutor').create({
        document: data.document,
        inscription: data.inscription,
        corporateName: data.corporate_name,
        email: data.email,
        cellphone: data.cellphone,
        telephone: data.telephone,
        messagePersonName: data.message_person_name,
        messagePersonPhone: data.message_person_phone,
        postalCode: data.postal_code,
        street: data.street,
        number: data.number,
        complement: data.complement,
        district: data.district,
        city: data.city,
        state: data.state,
      });

      await group.related('patients').attach([patient.id], trx);

      await trx.commit();

      return patient;
    } catch (e) {
      Logger.error(e.message);
      await trx.rollback();

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }

  public async assignPatientTutor(unitId: string, data: IAssignPatientTutor) {
    const tutor = await this.show(unitId, data.holder);
    const patient = await this.show(unitId, data.patient);

    const dependents = tutor.dependents.map(d => d.id);
    const updatedDependents = Array.from(new Set([...dependents, patient.id]));

    await tutor.related('dependents').sync(updatedDependents);
  }

  public async update(
    unitId: string,
    id: string,
    data: Omit<IPatientData, 'holderId'>,
  ): Promise<Patient> {
    const patient = await this.show(unitId, id);

    const trx = await Database.transaction();

    try {
      const photo = data.photo
        ? await this.uploadPhoto(data.photo)
        : patient.photo;

      await patient
        .merge({
          name: data.name,
          photo,
          gender: data.gender,
          tags: data.tags,
          birthDate: data.birthDate?.toJSDate(),
          active: data.active,
        })
        .useTransaction(trx)
        .save();

      if (patient.patientAnimal) {
        await patient.patientAnimal
          .merge({
            race_id: data.raceId,
          })
          .useTransaction(trx)
          .save();
      }

      await trx.commit();
    } catch (e) {
      Logger.error(e.message);
      await trx.rollback();

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }

    return patient;
  }

  public async updateTutor(
    unitId: string,
    id: string,
    data: IPatientTutorData,
  ): Promise<Patient> {
    const patient = await this.show(unitId, id);
    const tutorData = await patient.related('tutor').query().firstOrFail();

    const trx = await Database.transaction();

    try {
      const photo = data.photo
        ? await this.uploadPhoto(data.photo)
        : patient.photo;

      await tutorData
        .merge({
          document: data.document,
          inscription: data.inscription,
          corporateName: data.corporate_name,
          email: data.email,
          cellphone: data.cellphone,
          telephone: data.telephone,
          messagePersonName: data.message_person_name,
          messagePersonPhone: data.message_person_phone,
          postalCode: data.postal_code,
          street: data.street,
          number: data.number,
          complement: data.complement,
          district: data.district,
          city: data.city,
          state: data.state,
        })
        .useTransaction(trx)
        .save();

      await patient
        .merge({
          name: data.name,
          photo,
          gender: data.gender,
          tags: data.tags,
          birthDate: data.birthDate?.toJSDate(),
          active: data.active,
        })
        .useTransaction(trx)
        .save();

      await trx.commit();

      return patient;
    } catch (e) {
      Logger.error(e.message);
      await trx.rollback();

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
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
