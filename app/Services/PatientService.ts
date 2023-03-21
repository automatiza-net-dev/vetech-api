import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Bill, { BillStatus } from 'App/Models/Bill';
import Budget, { BudgetStatus } from 'App/Models/Budget';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Hospitalization, {
  HospitalizationType,
} from 'App/Models/Hospitalization';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import Patient, { PatientGender, PatientType } from 'App/Models/Patient';
import TimelineType, { ATTENDANCE_UUID } from 'App/Models/TimelineType';
import User from 'App/Models/User';
import IAssignPatientTutor from 'Contracts/interfaces/IAssignPatientTutor';
import IPatientData, {
  IFastStorePatient,
} from 'Contracts/interfaces/IPatientData';
import IPatientSupplierData from 'Contracts/interfaces/IPatientSupplierData';
import IPatientTutorData from 'Contracts/interfaces/IPatientTutorData';
import ISearchPatient from 'Contracts/interfaces/ISearchPatient';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { HospitalizationStatus } from '../Models/Hospitalization';

interface ISearch {
  name?: string;
  gender?: PatientGender;
  type?: PatientType;
}

interface ISearchAnimals {
  name?: string;
  tutor?: string;
  race?: string;
  specie?: string;
  document?: string;
  phone?: string;
}

interface ISearchTutor {
  name?: string;
  document?: string;
  phone?: string;
  patient?: string;
  race?: string;
}

interface ISearchSupplier {
  name?: string;
  document?: string;
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

  public async nonPets(unitId: string) {
    const group = await this.getEconomicGroup(unitId);

    const qb = group
      .related('patients')
      .query()
      .whereIn('type', [PatientType.TUTOR, PatientType.SUPPLIER])
      .preload('tutor');

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
        query.preload('clientOrigin');

        if (data.document) {
          query.where('document', 'ilike', `%${data.document}%`);
        }

        if (data.phone) {
          query.where('cellphone', 'ilike', `%${data.phone}%`);
        }
      })
      .preload('dependents', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.whereILike('description', `%${data.race ?? ''}`);
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

  public async supplierIndex(
    unitId: string,
    data: ISearchSupplier,
  ): Promise<Array<Patient>> {
    const group = await this.getEconomicGroup(unitId);

    const qb = group
      .related('patients')
      .query()
      .where('type', PatientType.SUPPLIER)
      .whereHas('tutor', query => {
        if (data.document) {
          query.where('document', 'ilike', `%${data.document}%`);
          query.where('inscription', 'ilike', `%${data.document}%`);
        }
      })
      .preload('tutor');

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    return qb;
  }

  public async animalsIndex(unitId: string, data: ISearchAnimals) {
    const group = await this.getEconomicGroup(unitId);

    const qb = group
      .related('patients')
      .query()
      .where('type', PatientType.ANIMAL);

    if (data.race) {
      qb.whereHas('patientAnimal', query => {
        query.whereHas('race', subquery => {
          subquery.whereILike('description', `%${data.race ?? ''}%`);
        });
      });
    }

    if (data.tutor) {
      qb.whereHas('tutors', query => {
        query.where('name', 'ilike', `%${data.tutor ?? ''}%`);
      });
    }

    qb.preload('tutors', query => {
      query
        .preload('tutor', query => {
          query.preload('clientOrigin');
        })
        .pivotColumns(['is_main']);
    });

    qb.preload('patientAnimal', query => {
      query.preload('race', q => {
        q.preload('specie');
      });
      query.preload('hair');
    });

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    const result = await qb;

    return result
      .filter(r => {
        if (data.document) {
          const matches = r.tutors.some(t =>
            t.tutor.document?.includes(data.document ?? ''),
          );

          if (!matches) {
            return false;
          }
        }

        if (data.phone) {
          const matches = r.tutors.some(t =>
            t.tutor.cellphone?.includes(data.phone ?? ''),
          );

          if (!matches) {
            return false;
          }
        }

        if (data.specie) {
          const matches = r.patientAnimal?.race?.specie.description
            .toLocaleLowerCase()
            .includes(data.specie.toLowerCase());

          if (!matches) {
            return false;
          }
        }

        return true;
      })
      .map(patient => {
        const mapped = patient.tutors.map(t => {
          return { ...t.toJSON(), is_main: Boolean(t.$extras.pivot_is_main) };
        });

        return { ...patient.toJSON(), tutors: mapped };
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
    const tutor = await Patient.query()
      .where('id', id)
      .preload('dependents')
      .first();

    if (!tutor) {
      throw new ResourceNotFoundException(
        'Tutor não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    const animalsIndex = await this.animalsIndex(unitId, {});

    const dependents = tutor.dependents.map(d => d.id);

    return animalsIndex.filter(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      f => !dependents.includes((f as unknown as Patient).id!),
    );
  }

  public async show(unitId: string, patientId: string) {
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

    if (patient.type === PatientType.ANIMAL) {
      const tutors = await patient
        .related('tutors')
        .query()
        .pivotColumns(['is_main'])
        .preload('tutor', query => {
          query.select(['id', 'cellphone', 'telephone', 'email']);
        });

      await patient.load('patientAnimal', query => {
        query.preload('race');
        query.preload('hair');
      });

      const mapped = tutors.map(t => {
        return { ...t.toJSON(), is_main: Boolean(t.$extras.pivot_is_main) };
      });

      return { ...patient.toJSON(), tutors: mapped };
    }

    if (patient.type === PatientType.TUTOR) {
      await patient.load('tutor', query => {
        query.preload('clientOrigin');
      });
      await patient.load('dependents');
    }

    if (patient.type === PatientType.SUPPLIER) {
      await patient.load('tutor');
    }

    return patient;
  }

  public async metadata(unitId: string, patientId: string) {
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

    const sales = await Bill.query()
      .where('patient_id', patient.id)
      .where('status', BillStatus.A);

    let total_sum = 0;
    let paid_sum = 0;

    sales.forEach(sale => {
      total_sum += sale.totalValue;
      paid_sum += sale.paidValue;
    });

    return {
      missingFromBills: total_sum - paid_sum,
    };
  }

  public async salesMetadata(unitId: string, patientId: string) {
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

    const sales = await Bill.query()
      .where('patient_id', patient.id)
      .preload('payments')
      .preload('seller')
      .preload('client');

    const budgets = await Budget.query()
      .where('patient_id', patient.id)
      .where('status', BudgetStatus.A)
      .preload('seller')
      .preload('client');

    const result: Array<unknown> = [];

    sales.forEach(sale => {
      const getStrStatus = (s: Bill) => {
        if (s.status === BillStatus.A) {
          return 'Venda em Aberto';
        }

        if (s.status === BillStatus.F) {
          return 'Venda Finalizada';
        }

        return '';
      };

      result.push({
        id: sale.id,
        _type: 'sale' as const,
        tag: sale.tag,
        date: sale.billDate.toJSDate(),
        seller: sale.seller.name,
        client: sale.client.name,
        total_value: sale.totalValue,
        missing_value:
          sale.totalValue -
          sale.payments.reduce((acc, curr) => acc + curr.totalValue, 0),
        status: getStrStatus(sale),
      });
    });

    budgets.forEach(item => {
      result.push({
        id: item.id,
        _type: 'budget' as const,
        tag: item.tag,
        date: item.budgetDate.toJSDate(),
        seller: item.seller.name,
        client: item.client.name,
        total_value: item.totalValue,
        missing_value: null,
        status: 'Orçamento em aberto',
      });
    });

    return result;
  }

  public async fastStore(unitId: string, data: IFastStorePatient) {
    const group = await this.getEconomicGroup(unitId);

    const client = Database.connection();
    return Database.transaction(async trx => {
      const tutors = await group
        .related('patients')
        .query()
        .useTransaction(trx)
        .where('type', PatientType.TUTOR)
        .select('id');

      const patients = await group
        .related('patients')
        .query()
        .useTransaction(trx)
        .where('type', PatientType.ANIMAL)
        .select('id');

      const tutor = await Patient.create(
        {
          name: data.tutorName,
          type: PatientType.TUTOR,
          tag: (tutors.length + 1).toString(),
        },
        { client: trx },
      );

      await tutor.related('tutor').create({
        email: data.tutorEmail,
        cellphone: data.tutorPhone,
        telephone: data.tutorPhone,
      });

      await group.related('patients').attach([tutor.id], trx);

      const patient = await Patient.create(
        {
          name: data.patientName,
          gender: data.patientGender,
          type: PatientType.ANIMAL,
          tag: (patients.length + 1).toString(),
        },
        {
          client: trx,
        },
      );

      await tutor.related('dependents').attach([patient.id], trx);
      await group.related('patients').attach([patient.id], trx);
      await patient.related('patientAnimal').create(
        {
          race_id: data.patientRaceId,
        },
        trx,
      );

      await client
        .from('holder_dependents')
        .where('dependent_id', patient.id)
        .where('holder_id', tutor.id)
        .update({ is_main: true })
        .useTransaction(trx);

      return {
        tutor,
        patient,
      };
    });
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

    const patients = await group
      .related('patients')
      .query()
      .where('type', PatientType.ANIMAL)
      .select('id');

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
          vaccineOrigin: data.vaccineOrigin,
          tag: (patients.length + 1).toString(),
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
          hair_id: data.hairId,
          microchip: data.microchip,
          castrated: data.castrated,
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

    const tutors = await group
      .related('patients')
      .query()
      .where('type', PatientType.TUTOR)
      .select('id');

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
          tag: (tutors.length + 1).toString(),
        },
        { client: trx },
      );

      await patient.related('tutor').create({
        residence: data.residence,
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
        client_origin_id: data.clientOriginId,
        cityCode: data.cityCode,
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

  public async assignPatientTutor(_: string, data: IAssignPatientTutor) {
    const tutor = await Patient.query()
      .where('id', data.holder)
      .where('type', PatientType.TUTOR)
      .preload('dependents')
      .first();

    if (!tutor) {
      throw new BadRequestException('Tutor inválido', 400, 'E_BAD_REQUEST');
    }

    const dependents = tutor.dependents.map(d => d.id);
    const updatedDependents = Array.from(
      new Set([...dependents, data.patient]),
    );

    await tutor.related('dependents').sync(updatedDependents);
  }

  public async storeSupplier(
    unitId: string,
    data: Omit<IPatientSupplierData, 'active'>,
  ): Promise<Patient> {
    const group = await this.getEconomicGroup(unitId);

    return Database.transaction(async trx => {
      const photo = data.photo ? await this.uploadPhoto(data.photo) : undefined;

      const supplier = await group
        .related('patients')
        .query()
        .useTransaction(trx)
        .where('type', PatientType.SUPPLIER)
        .select('id');

      const patient = await Patient.create(
        {
          name: data.name,
          tags: data.tags,
          photo,
          type: PatientType.SUPPLIER,
          tag: (supplier.length + 1).toString(),
        },
        { client: trx },
      );

      await patient.related('tutor').create({
        residence: data.residence,
        document: data.document,
        inscription: data.stateInscription,
        corporateName: data.corporateName,
        email: data.email,
        cellphone: data.cellphone,
        telephone: data.telephone,
        messagePersonName: data.messagePersonName,
        messagePersonPhone: data.messagePersonPhone,
        postalCode: data.postalCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        district: data.district,
        city: data.city,
        state: data.state,
        cityCode: data.cityCode,
      });

      await group.related('patients').attach([patient.id], trx);

      return patient;
    });
  }

  public async update(
    unitId: string,
    user: User,
    id: string,
    data: Omit<IPatientData, 'holderId'> & {
      death: boolean;
      deathDate?: DateTime;
    },
  ): Promise<Patient> {
    const group = await this.getEconomicGroup(unitId);

    return Database.transaction(async trx => {
      const patient = await group
        .related('patients')
        .query()
        .useTransaction(trx)
        .where('patient_id', id)
        .preload('patientAnimal')
        .first();

      if (!patient) {
        throw new ResourceNotFoundException(
          'Paciente não encontrado',
          404,
          'E_NOT_FOUND',
        );
      }

      if (!patient?.patientAnimal.death && data.death) {
        const hospitalization = await Hospitalization.query()
          .useTransaction(trx)
          .where('patient_id', patient.id)
          .where('status', HospitalizationStatus.ACTIVE)
          .limit(1)
          .first();

        if (hospitalization) {
          await HospitalizationTimeline.create({
            meta: {
              hospitalization: hospitalization.id,
              group: group.id,
              unit: unitId,
              origin: 'death_occurrence',
            },
            data: {
              type: HospitalizationType[hospitalization.type],
              hospitalizedAt: hospitalization.createdAt,
              realizedAt: data.deathDate,
              issuedAt: DateTime.now(),
              technician: {
                id: user.id,
                name: user.name,
              },
              attachments: [],
            },
          });
        } else {
          const timelineInfo = await TimelineType.findOrFail(ATTENDANCE_UUID, {
            client: trx,
          });

          await AnimalTimeline.create({
            timeline_id: ATTENDANCE_UUID,
            timeline_type: {
              description: timelineInfo.description,
              color: timelineInfo.color,
              requires_observation: timelineInfo.requiresObservation,
            },
            timeline_info: {
              tag: patient.id,
              event: 'OBITO',
              realized: DateTime.now(),
              resume: 'Óbito',
              description: 'Óbito',
              technician: {
                id: user.id,
                name: user.name,
              },
            },
          });
        }
      }

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
          vaccineOrigin: data.vaccineOrigin,
        })
        .useTransaction(trx)
        .save();

      if (patient.patientAnimal) {
        await patient.patientAnimal
          .merge({
            race_id: data.raceId,
            hair_id: data.hairId,
            microchip: data.microchip,
            castrated: data.castrated,
            death: data.death,
            deathDate: data.deathDate,
          })
          .useTransaction(trx)
          .save();
      }

      return patient;
    });
  }

  public async updateTutor(
    _: string,
    id: string,
    data: IPatientTutorData,
  ): Promise<Patient> {
    const tutor = await Patient.query()
      .where('id', id)
      .where('type', PatientType.TUTOR)
      .preload('tutor')
      .first();

    if (!tutor) {
      throw new BadRequestException('Tutor inválido', 400, 'E_BAD_REQUEST');
    }

    const trx = await Database.transaction();

    try {
      const photo = data.photo
        ? await this.uploadPhoto(data.photo)
        : tutor.photo;

      await tutor.tutor
        .merge({
          residence: data.residence,
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
          client_origin_id: data.clientOriginId,
          cityCode: data.cityCode,
        })
        .useTransaction(trx)
        .save();

      await tutor
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

      return tutor;
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

  public async updateSupplier(
    _: string,
    id: string,
    data: IPatientSupplierData,
  ): Promise<Patient> {
    return Database.transaction(async trx => {
      const supplier = await Patient.query()
        .useTransaction(trx)
        .where('id', id)
        .where('type', PatientType.SUPPLIER)
        .preload('tutor')
        .first();

      if (!supplier) {
        throw new BadRequestException(
          'Fornecedor inválido',
          400,
          'E_BAD_REQUEST',
        );
      }

      const photo = data.photo
        ? await this.uploadPhoto(data.photo)
        : supplier.photo;

      await supplier.tutor
        .merge({
          residence: data.residence,
          document: data.document,
          inscription: data.stateInscription,
          corporateName: data.corporateName,
          email: data.email,
          cellphone: data.cellphone,
          telephone: data.telephone,
          messagePersonName: data.messagePersonName,
          messagePersonPhone: data.messagePersonPhone,
          postalCode: data.postalCode,
          street: data.street,
          number: data.number,
          complement: data.complement,
          district: data.district,
          city: data.city,
          state: data.state,
          cityCode: data.cityCode,
        })
        .useTransaction(trx)
        .save();

      await supplier
        .merge({
          name: data.name,
          photo,
          tags: data.tags,
          active: data.active,
        })
        .useTransaction(trx)
        .save();

      return supplier;
    });
  }

  public async destroy(unitId: string, patientId: string): Promise<void> {
    const group = await this.getEconomicGroup(unitId);
    const patient = await Patient.query().where('id', patientId).first();

    if (!patient) {
      throw new BadRequestException('Paciente inválido', 400, 'E_BAD_REQUEST');
    }

    const groups = await patient.related('economicGroup').query();

    await patient.related('economicGroup').detach([group.id]);

    if (groups.length > 1) {
      return;
    }

    await patient.softDelete();
  }

  public async setMainTutor(_: string, patient: string, tutor: string) {
    const db_patient = await Patient.query()
      .where('id', patient)
      .where('type', PatientType.ANIMAL)
      .first();

    if (!db_patient) {
      throw new BadRequestException('Paciente inválido', 400, 'E_BAD_REQUEST');
    }

    const db_tutor = await Patient.query()
      .where('id', tutor)
      .where('type', PatientType.TUTOR)
      .first();

    if (!db_tutor) {
      throw new BadRequestException('Tutor inválido', 400, 'E_BAD_REQUEST');
    }

    const patientTutors = await db_patient
      .related('tutors')
      .query()
      .where('dependent_id', patient);

    const client = Database.connection();

    const trx = await Database.transaction();

    try {
      const promises = patientTutors.map(t => {
        return client
          .from('holder_dependents')
          .where('dependent_id', patient)
          .where('holder_id', t.id)
          .update({ is_main: t.id === tutor })
          .useTransaction(trx);
      });

      await Promise.all(promises);

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
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
