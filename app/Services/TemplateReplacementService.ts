import { inject } from '@adonisjs/fold';
import { ModelObject } from '@ioc:Adonis/Lucid/Orm';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Patient, {
  PatientGender,
  PatientVaccineOrigin,
} from 'App/Models/Patient';
import Schedule from 'App/Models/Schedule';
import TemplateReplacement, {
  TemplateReplacementOrigin,
} from 'App/Models/TemplateReplacement';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import ITemplateReplacementData, {
  ITemplateReplacementParser,
} from 'Contracts/interfaces/ITemplateReplacementData';
import { format } from 'date-fns';
import * as Locales from 'date-fns/locale';

interface ISearch {
  origin?: string;
  attribute?: string;
  replacer?: string;
}

type RenderTextData = Record<TemplateReplacementOrigin, ModelObject | null>;
@inject()
export default class TemplateReplacementService {
  constructor(private readonly sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = TemplateReplacement.query().where('economic_group_id', group.id);

    if (data.origin) {
      qb.where('origin', data.origin);
    }

    if (data.attribute) {
      qb.whereILike('attribute', data.attribute);
    }

    if (data.replacer) {
      qb.whereILike('replacer', data.replacer);
    }

    return qb;
  }

  async store(unitId: string, data: ITemplateReplacementData) {
    const group = await this.sharedService.getUserGroup(unitId);

    if (data.origin === TemplateReplacementOrigin.SYSTEM) {
      throw new BadRequestException(
        'Você não pode criar esse tipo',
        400,
        'E_ERR',
      );
    }

    return TemplateReplacement.create({
      economic_group_id: group.id,

      attribute: data.attribute,
      origin: data.origin,
      replacer: data.replacer,
    });
  }

  async update(unitId: string, id: string, data: ITemplateReplacementData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const template = await TemplateReplacement.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!template) {
      throw this.sharedService.ResourceNotFound();
    }

    return template
      .merge({
        attribute: data.attribute,
        origin: data.origin,
        replacer: data.replacer,
      })
      .save();
  }

  async destroy(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const template = await TemplateReplacement.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!template) {
      throw this.sharedService.ResourceNotFound();
    }

    return template.delete();
  }

  async renderText(unitId: string, data: ITemplateReplacementParser) {
    const group = await this.sharedService.getUserGroup(unitId);

    const date = new Date();
    const textData: RenderTextData = {
      BUSINESS: null,
      USER: null,
      SCHEDULE: null,
      TUTOR: null,
      PATIENT: null,
      SYSTEM: {
        date: format(date, 'dd/MM/yyyy', {
          locale: Locales.ptBR,
        }),
        dateextension: format(date, "dd 'de' MMMM 'de' yyyy", {
          locale: Locales.ptBR,
        }),
        time: format(date, 'HH:mm', {
          locale: Locales.ptBR,
        }),
      },
    };

    if (data.businessUnitId) {
      textData.BUSINESS = await this.fetchUnit(data.businessUnitId);
    }

    if (data.userId) {
      const user = await User.findOrFail(data.userId);
      textData.USER = user.toObject();
    }

    if (data.scheduleId) {
      const schedule = await Schedule.findOrFail(data.scheduleId);
      textData.SCHEDULE = schedule.toObject();
    }

    if (data.tutorId) {
      textData.TUTOR = await this.fetchTutor(data.tutorId);
    }

    if (data.dependentId) {
      textData.PATIENT = await this.fetchPatient(data.dependentId);
    }

    const templates = await TemplateReplacement.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [group.id],
    );

    return this.parseTemplate(data.base, textData, templates);
  }

  parseTemplate(
    raw: string,
    data: RenderTextData,
    templates: TemplateReplacement[],
  ): string {
    if (templates.length === 0) {
      return raw;
    }

    const [head, ...tail] = templates;

    const elem = data[head.origin];
    if (!elem) {
      return this.parseTemplate(raw, data, tail);
    }

    const value = elem[head.attribute];
    const value$ = value
      ? this.$toString(value) ?? head.attribute
      : head.attribute;

    const updated = raw.replace(head.replacer, value$);

    return this.parseTemplate(updated, data, tail);
  }

  $toString(data: unknown) {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'number' || typeof data === 'bigint') {
      return data.toString();
    }

    if (typeof data === 'boolean') {
      return data ? 'Sim' : 'Não';
    }

    if (data instanceof Date) {
      return data.toDateString();
    }

    return null;
  }

  async fetchTutor(id: string) {
    const tutor = await Patient.query()
      .where('id', id)
      .preload('tutor')
      .firstOrFail();

    return {
      ...tutor.toJSON(),
      firstName: tutor.name.split(' ').at(0),
      address: [tutor.tutor?.street, tutor.tutor?.number]
        .filter(Boolean)
        .join(' - '),
      district: tutor.tutor.district,
      city: tutor.tutor.city,
      state: tutor.tutor.state,
      postalCode: tutor.tutor.postalCode,
      document: tutor.tutor.document,
      cellphone: tutor.tutor.cellphone,
      email: tutor.tutor.email,
    };
  }

  async fetchPatient(id: string) {
    const patient = await Patient.query()
      .where('id', id)
      .preload('patientAnimal', query => {
        query.preload('hair');
        query.preload('race', query => {
          query.preload('specie');
        });
      })
      .firstOrFail();

    const calculateGender = (data: Patient) => {
      if (!data.gender) {
        return 'não informado';
      }

      return data.gender === PatientGender.MALE ? 'macho' : 'fêmea';
    };

    const calculateVaccine = (data: PatientVaccineOrigin) => {
      if (data === PatientVaccineOrigin.C) {
        return 'Própria clinica';
      }

      if (data === PatientVaccineOrigin.F) {
        return 'Fora da clinica';
      }

      return 'Não vacinado';
    };

    return {
      ...patient.toJSON(),
      gender: calculateGender(patient),
      hair: patient.patientAnimal?.hair?.description,
      race: patient.patientAnimal.race?.description,
      specie: patient.patientAnimal.race?.specie?.description,
      vaccinated: calculateVaccine(patient.vaccineOrigin),
    };
  }

  async fetchUnit(id: string) {
    const model = await BusinessUnit.query().where('id', id).firstOrFail();

    return {
      ...model.toJSON(),
      fantasyName: model.fantasyName,
      companyName: model.companyName,
      postalCode: model.postalCode,
    };
  }
}
