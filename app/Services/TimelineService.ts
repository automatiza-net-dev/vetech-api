import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Database from '@ioc:Adonis/Lucid/Database';
import { connection } from '@ioc:Mongoose';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Hospitalization, {
  HospitalizationStatus,
  HospitalizationType,
} from 'App/Models/Hospitalization';
import { IAnimalDocument } from 'App/Models/mongoose/AnimalDocument';
import { IAnimalPathology } from 'App/Models/mongoose/AnimalPathology';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import { IAnimalWeight } from 'App/Models/mongoose/AnimalWeight';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import { IPatientEvaluation } from 'App/Models/mongoose/PatientEvaluation';
import { IPatientGlycemia } from 'App/Models/mongoose/PatientGlycemia';
import { IPatientPressure } from 'App/Models/mongoose/PatientPressure';
import Patient, { PatientWeightOrigin } from 'App/Models/Patient';
import PatientExam from 'App/Models/PatientExam';
import PatientVaccine from 'App/Models/PatientVaccine';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import TimelineType from 'App/Models/TimelineType';
import User from 'App/Models/User';
import ICreateAnimalExam from 'Contracts/interfaces/ICreateAnimalExam';
import ICreateAnimalPhoto from 'Contracts/interfaces/ICreateAnimalPhoto';
import ICreateAnimalVaccine from 'Contracts/interfaces/ICreateAnimalVaccine';
import ICreateAppointment from 'Contracts/interfaces/ICreateAppointment';
import { ICreateObservation } from 'Contracts/interfaces/ICreateObservation';
import { ICreateTimelineDischarge } from 'Contracts/interfaces/ICreateTimelineHospitalization';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { IAnimalMedicalRecipe } from '../Models/mongoose/AnimalMedicalRecipe';

@inject()
export default class TimelineService {
  public async all(tag: string) {
    return AnimalTimeline.find({
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async weightIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Peso',
      },
      {
        color: '#000000',
        description: 'Peso',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeWeight(data: IAnimalWeight) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Peso',
      },
      {
        color: '#000000',
        description: 'Peso',
        requiresObservation: false,
      },
    );

    return Database.transaction(async trx => {
      const technician = await User.findOrFail(data.technicianId, {
        client: trx,
      });
      const patient = await Patient.findOrFail(data.tag, {
        client: trx,
      });

      await patient
        .merge({
          weight: data.weight,
          weightDate: DateTime.now(),
          weightOrigin: PatientWeightOrigin.A,
        })
        .useTransaction(trx)
        .save();

      return AnimalTimeline.create({
        timeline_id: timelineInfo.id,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          weight: data.weight,
          tag: data.tag,
          realizedAt: data.realizedAt.toJSDate(),
          technician: {
            id: technician.id,
            name: technician.name,
          },
          observation: data.observation,
        },
      });
    });
  }

  public async updateWeight(id: string, data: IAnimalWeight) {
    return Database.transaction(async trx => {
      const record = await AnimalTimeline.findById(id);

      if (!record) {
        throw new ResourceNotFoundException('Recurso não encontrado');
      }

      const timelineInfo = await TimelineType.firstOrCreate(
        {
          description: 'Peso',
        },
        {
          color: '#000000',
          description: 'Peso',
          requiresObservation: false,
        },
        {
          client: trx,
        },
      );
      const technician = await User.findOrFail(data.technicianId, {
        client: trx,
      });
      const patient = await Patient.findOrFail(data.tag, { client: trx });

      await patient
        .merge({
          weight: data.weight,
          weightDate: DateTime.now(),
          weightOrigin: PatientWeightOrigin.A,
        })
        .useTransaction(trx)
        .save();

      return AnimalTimeline.findByIdAndUpdate(id, {
        $set: {
          timeline_id: timelineInfo.id,
          timeline_type: {
            description: timelineInfo.description,
            color: timelineInfo.color,
            requires_observation: timelineInfo.requiresObservation,
          },
          timeline_info: {
            weight: data.weight,
            tag: data.tag,
            realizedAt: data.realizedAt.toJSDate(),
            technician: {
              id: technician.id,
              name: technician.name,
            },
            observation: data.observation,
          },
        },
      });
    });
  }

  public async pressureIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Aferição de Pressão',
      },
      {
        color: '#000000',
        description: 'Aferição de Pressão',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storePressure(data: IPatientPressure) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Aferição de Pressão',
      },
      {
        color: '#000000',
        description: 'Aferição de Pressão',
        requiresObservation: false,
      },
    );

    return Database.transaction(async trx => {
      const technician = await User.findOrFail(data.technicianId, {
        client: trx,
      });

      return AnimalTimeline.create({
        timeline_id: timelineInfo.id,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          pressure: data.pressure,
          tag: data.tag,
          realizedAt: data.realizedAt.toJSDate(),
          technician: {
            id: technician.id,
            name: technician.name,
          },
          observation: data.observation,
        },
      });
    });
  }

  public async glycemiaIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Glicemia',
      },
      {
        color: '#000000',
        description: 'Glicemia',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeGlycemia(data: IPatientGlycemia) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Glicemia',
      },
      {
        color: '#000000',
        description: 'Glicemia',
        requiresObservation: false,
      },
    );

    return Database.transaction(async trx => {
      const technician = await User.findOrFail(data.technicianId, {
        client: trx,
      });

      return AnimalTimeline.create({
        timeline_id: timelineInfo.id,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          value: data.value,
          tag: data.tag,
          realizedAt: data.realizedAt.toJSDate(),
          technician: {
            id: technician.id,
            name: technician.name,
          },
          observation: data.observation,
        },
      });
    });
  }

  public async evaluationIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Avaliação',
      },
      {
        color: '#000000',
        description: 'Avaliação',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeEvaluation(data: IPatientEvaluation) {
    return Database.transaction(async trx => {
      const timelineInfo = await TimelineType.firstOrCreate(
        {
          description: 'Avaliação',
        },
        {
          color: '#000000',
          description: 'Avaliação',
          requiresObservation: false,
        },
      );

      const scheduleServiceType = await ScheduleServiceType.findOrFail(
        data.scheduleServiceTypeId,
        {
          client: trx,
        },
      );

      const technician = await User.findOrFail(data.technicianId, {
        client: trx,
      });

      return AnimalTimeline.create({
        timeline_id: timelineInfo.id,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: data.tag,
          realizedAt: data.realizedAt.toJSDate(),
          resume: data.resume,
          protocol: data.protocol,
          observation: data.observation ?? null,
          internalObservation: data.internalObservation ?? null,
          technician: {
            id: technician.id,
            name: technician.name,
          },
          service: {
            id: scheduleServiceType.id,
            description: scheduleServiceType.description,
            resume: scheduleServiceType.resume,
          },
          photos: data.photos
            ? await Promise.all(data.photos.map(this.uploadPhoto))
            : [],
        },
      });
    });
  }

  public async updateEvaluation(id: string, data: IPatientEvaluation) {
    return Database.transaction(async trx => {
      const record = await AnimalTimeline.findById(id);

      if (!record) {
        throw new ResourceNotFoundException('Recurso não encontrado');
      }

      const scheduleServiceType = await ScheduleServiceType.findOrFail(
        data.scheduleServiceTypeId,
        {
          client: trx,
        },
      );

      const technician = await User.findOrFail(data.technicianId, {
        client: trx,
      });

      return AnimalTimeline.findByIdAndUpdate(id, {
        $set: {
          'timeline_info.tag': data.tag,
          'timeline_info.realizedAt': data.realizedAt.toJSDate(),
          'timeline_info.resume': data.resume,
          'timeline_info.protocol': data.protocol,
          'timeline_info.observation': data.observation ?? null,
          'timeline_info.internalObservation': data.internalObservation ?? null,
          'timeline_info.technician.id': technician.id,
          'timeline_info.technician.name': technician.name,
          'timeline_info.service.id': scheduleServiceType.id,
          'timeline_info.service.description': scheduleServiceType.description,
          'timeline_info.service.resume': scheduleServiceType.resume,

          'timeline_info.photos': data.photos
            ? [
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore does have photos
                ...(record.timeline_info?.photos ?? []),
                ...(await Promise.all(data.photos.map(this.uploadPhoto))),
              ].filter(Boolean)
            : [],
        },
      });
    });
  }

  public async deleteEvaluationPhoto(id: string, index: string) {
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const numericIndex = parseInt(index, 10);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore does have photos
    const cleanPhotos = record.timeline_info?.photos?.filter(
      (_, idx) => idx !== numericIndex,
    );

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        'timeline_info.photos': cleanPhotos,
      },
    });
  }

  public async documentIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Documento',
      },
      {
        color: '#000000',
        description: 'Documento',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeDocument(data: IAnimalDocument) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Documento',
      },
      {
        color: '#000000',
        description: 'Documento',
        requiresObservation: false,
      },
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        type: data.type,
        value: data.value,
        realizedAt: new Date(),
        technician: {
          id: technician.id,
          name: technician.name,
        },
      },
    });
  }

  public async updateDocument(id: string, data: IAnimalDocument) {
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Documento',
      },
      {
        color: '#000000',
        description: 'Documento',
        requiresObservation: false,
      },
    );
    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        timeline_id: timelineInfo.id,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: data.tag,
          type: data.type,
          value: data.value,
          realizedAt: new Date(),
          technician: {
            id: technician.id,
            name: technician.name,
          },
        },
      },
    });
  }

  public async pathologyIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Patologia',
      },
      {
        color: '#000000',
        description: 'Patologia',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storePathology(data: IAnimalPathology) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Patologia',
      },
      {
        color: '#000000',
        description: 'Patologia',
        requiresObservation: false,
      },
    );
    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        pathology: data.pathology,
        realizedAt: data.realizedAt.toJSDate(),
        technician: {
          id: technician.id,
          name: technician.name,
        },
        description: data.description,
        defaultProtocol: data.defaultProtocol,
      },
    });
  }

  public async updatePathology(
    id: string,
    data: Omit<IAnimalPathology, 'tag'>,
  ) {
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        'timeline_info.pathology': data.pathology,
        'timeline_info.realizedAt': data.realizedAt.toJSDate(),
        'timeline_info.technician.id': technician.id,
        'timeline_info.technician.name': technician.name,
        'timeline_info.description': data.description,
        'timeline_info.defaultProtocol': data.defaultProtocol,
      },
    });
  }

  public async medicalRecipeIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Formato Receita Médica',
      },
      {
        color: '#000000',
        description: 'Formato Receita Médica',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeMedicalRecipe(data: IAnimalMedicalRecipe) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Formato Receita Médica',
      },
      {
        color: '#000000',
        description: 'Formato Receita Médica',
        requiresObservation: false,
      },
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        name: data.name,
        realizedAt: data.realizedAt.toJSDate(),
        technician: {
          id: technician.id,
          name: technician.name,
        },
        recipe: data.recipe,
      },
    });
  }

  public async updateMedicalRecipe(id: string, data: IAnimalMedicalRecipe) {
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Formato Receita Médica',
      },
      {
        color: '#000000',
        description: 'Formato Receita Médica',
        requiresObservation: false,
      },
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        timeline_id: timelineInfo.id,
        timeline_type: {
          description: timelineInfo.description,
          color: timelineInfo.color,
          requires_observation: timelineInfo.requiresObservation,
        },
        timeline_info: {
          tag: data.tag,
          name: data.name,
          realizedAt: data.realizedAt.toJSDate(),
          technician: {
            id: technician.id,
            name: technician.name,
          },
          recipe: data.recipe,
        },
      },
    });
  }

  public async photoIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Fotos',
      },
      {
        color: '#000000',
        description: 'Fotos',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storePhoto(data: ICreateAnimalPhoto) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Fotos',
      },
      {
        color: '#000000',
        description: 'Fotos',
        requiresObservation: false,
      },
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        photo: await Promise.all(data.photos.map(this.uploadPhoto)),
        observation: data.observation ?? '',
        title: data.title ?? '',
        technician: {
          id: technician.id,
          name: technician.name,
        },
      },
    });
  }

  public async deletePhoto(id: string) {
    return AnimalTimeline.findByIdAndDelete(id);
  }

  public async vaccineIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Vacinas',
      },
      {
        color: '#000000',
        description: 'Vacinas',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeVaccine(data: ICreateAnimalVaccine) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Vacinas',
      },
      {
        color: '#000000',
        description: 'Vacinas',
        requiresObservation: false,
      },
    );

    const technician = await User.findOrFail(data.technicianId);
    const vaccine = await PatientVaccine.findOrFail(data.vaccineId);
    await vaccine.load('calendars');

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        name: data.name,
        technician: {
          id: technician.id,
          name: technician.name,
        },
        vaccine: {
          id: vaccine.id,
          schedule: vaccine.schedule_id,
          calendars: vaccine.calendars.map(c => c.id),
        },
        expectedDate: data.expectedDate?.toJSDate(),
        applicationDate: data.applicationDate?.toJSDate(),
        laboratory: data.laboratory,
        batch: data.batch,
      },
    });
  }

  public async updateVaccine(id: string, data: ICreateAnimalVaccine) {
    const resource = await AnimalTimeline.findById(id);

    if (!resource) {
      throw new ResourceNotFoundException('Vaccine not found');
    }

    const technician = await User.findOrFail(data.technicianId);
    const vaccine = await PatientVaccine.findOrFail(data.vaccineId);
    await vaccine.load('calendars');

    resource.timeline_info = {
      tag: data.tag,
      name: data.name,
      technician: {
        id: technician.id,
        name: technician.name,
      },
      vaccine: {
        id: vaccine.id,
        schedule: vaccine.schedule_id,
        calendars: vaccine.calendars.map(c => c.id),
      },
      expectedDate: data.expectedDate?.toJSDate(),
      applicationDate: data.applicationDate?.toJSDate(),
      laboratory: data.laboratory,
      batch: data.batch,
    };

    await resource.save();

    return resource;
  }

  public async examIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Exames',
      },
      {
        color: '#000000',
        description: 'Exames',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeExam(data: ICreateAnimalExam) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Exames',
      },
      {
        color: '#000000',
        description: 'Exames',
        requiresObservation: false,
      },
    );

    const requester = await User.findOrFail(data.requesterId);
    const technician = await User.findOrFail(data.technicianId);
    const exam = await PatientExam.query()
      .where('id', data.examId)
      .preload('exam')
      .firstOrFail();

    const medias = data.attachments
      ? await Promise.all(data.attachments.map(this.uploadPhoto))
      : [];

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        name: data.name,
        realized: data.realizedAt,
        description: data.description,
        requester: {
          id: requester.id,
          name: requester.name,
        },
        technician: {
          id: technician.id,
          name: technician.name,
        },
        exam: {
          id: exam.id,
          name: exam.exam.name,
          description: exam.exam.description,
          own_laboratory: exam.exam.ownLaboratory,
          type: exam.exam.type,
          result_data: exam.resultDate,
          executed_at: exam.executedAt,
        },
        attachments: medias,
      },
    });
  }

  public async appointmentIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Consulta',
      },
      {
        color: '#000000',
        description: 'Consulta',
        requiresObservation: false,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeAppointment(data: ICreateAppointment) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Consulta',
      },
      {
        color: '#000000',
        description: 'Consulta',
        requiresObservation: false,
      },
    );

    const serviceType = await ScheduleServiceType.findOrFail(
      data.scheduleServiceId,
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        realized: data.realizedAt,
        resume: data.resume,
        protocol: data.protocol,
        technician: {
          id: technician.id,
          name: technician.name,
        },
        service: {
          id: serviceType.id,
          resume: serviceType.resume,
          description: serviceType.description,
        },
      },
    });
  }

  public async hospitalizationIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Hospitalização',
      },
      {
        color: '#000000',
        description: 'Hospitalização',
        requiresObservation: false,
      },
    );

    return HospitalizationTimeline.find({
      timeline_id: timelineInfo.id,
      'patient.id': tag,
    });
  }

  // public async storeHospitalization(data: ICreateTimelineHospitalization) {
  //   const timelineInfo = await TimelineType.findOrFail(timelineInfo.id);

  //   const technician = await User.findOrFail(data.technicianId);

  //   return AnimalTimeline.create({
  //     timeline_id: timelineInfo.id,
  //     timeline_type: {
  //       description: timelineInfo.description,
  //       color: timelineInfo.color,
  //       requires_observation: timelineInfo.requiresObservation,
  //     },
  //     timeline_info: {
  //       tag: data.tag,
  //       type: 'hospitalization',
  //       technician: {
  //         id: technician.id,
  //         name: technician.name,
  //       },
  //       situation: data.situation,
  //       box: data.box,
  //       risk: data.risk,
  //       expectedDate: data.expectedDate.toJSDate(),
  //       complaint: data.complaint,
  //       diagnosis: data.diagnosis,
  //       prognosis: data.prognosis,
  //     },
  //   });
  // }

  public async storeDischarge(data: ICreateTimelineDischarge) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Hospitalização',
      },
      {
        color: '#000000',
        description: 'Hospitalização',
        requiresObservation: false,
      },
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        type: 'hospitalization',
        technician: {
          id: technician.id,
          name: technician.name,
        },
        dischargeDate: data.dischargeDate.toJSDate(),
        observation: data.observation,
      },
    });
  }

  public async observationsIndex(tag: string) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Observação',
      },
      {
        color: '#000000',
        description: 'Observação',
        requiresObservation: true,
      },
    );

    return AnimalTimeline.find({
      timeline_id: timelineInfo.id,
      'timeline_info.tag': tag,
    }).sort({ createdAt: -1 });
  }

  public async storeObservations(data: ICreateObservation) {
    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Observação',
      },
      {
        color: '#000000',
        description: 'Observação',
        requiresObservation: true,
      },
    );

    const technician = await User.findOrFail(data.technicianId);

    const medias = data.medias
      ? await Promise.all(data.medias.map(this.uploadPhoto))
      : [];

    const result = await AnimalTimeline.create({
      timeline_id: timelineInfo.id,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        observation: data.observation,
        tag: data.tag,
        resume: data.resume,
        technician: {
          id: technician.id,
          name: technician.name,
        },
        medias,
      },
    });

    await connection.db.collection('timelines').updateOne(
      {
        _id: result._id,
      },
      {
        $set: {
          createdAt: data.createdAt?.toJSDate() ?? new Date(),
        },
      },
    );
  }

  public async updateObservations(id: string, data: ICreateObservation) {
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const timelineInfo = await TimelineType.firstOrCreate(
      {
        description: 'Observação',
      },
      {
        color: '#000000',
        description: 'Observação',
        requiresObservation: true,
      },
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        timeline_id: timelineInfo.id,
        'timeline_type.description': timelineInfo.description,
        'timeline_type.color': timelineInfo.color,
        'timeline_type.requires_observation': timelineInfo.requiresObservation,
        'timeline_info.tag': data.tag,
        'timeline_info.resume': data.resume,
        'timeline_info.observation': data.observation ?? null,
        'timeline_info.technician.id': technician.id,
        'timeline_info.technician.name': technician.name,
        'timeline_info.medias': data.medias
          ? [
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore does have photos
              ...(record.timeline_info?.medias ?? []),
              ...(await Promise.all(data.medias.map(this.uploadPhoto))),
            ].filter(Boolean)
          : [],
      },
    });
  }

  public async deleteObservationMedia(id: string, index: string) {
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const numericIndex = parseInt(index, 10);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore does have photos
    const cleanMedias = record.timeline_info?.medias?.filter(
      (_, idx) => idx !== numericIndex,
    );

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        'timeline_info.medias': cleanMedias,
      },
    });
  }

  public async storeDeath(
    unitId: string,
    data: { tag: string; technicianId: string },
  ) {
    return Database.transaction(async trx => {
      const timelineInfo = await TimelineType.firstOrCreate(
        {
          description: 'Consulta',
        },
        {
          color: '#000000',
          description: 'Consulta',
          requiresObservation: false,
        },
        {
          client: trx,
        },
      );

      const unit = await BusinessUnit.query()
        .useTransaction(trx)
        .where('id', unitId)
        .preload('economicGroup')
        .firstOrFail();

      const technician = await User.findOrFail(data.technicianId, {
        client: trx,
      });

      const patient = await Patient.query()
        .useTransaction(trx)
        .where('id', data.tag)
        .preload('patientAnimal')
        .firstOrFail();

      if (patient.patientAnimal.death) {
        throw new BadRequestException(
          'Animal já está marcado como em óbito',
          400,
          'E_ERR',
        );
      }

      await patient.patientAnimal
        .merge({
          death: true,
          deathDate: DateTime.now(),
        })
        .useTransaction(trx)
        .save();

      await AnimalTimeline.create({
        timeline_id: timelineInfo.id,
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
            id: technician.id,
            name: technician.name,
          },
        },
      });

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
            group: unit.economicGroupId,
            unit: unit.id,
            origin: 'death_occurrence',
          },
          data: {
            type: HospitalizationType[hospitalization.type],
            hospitalizedAt: hospitalization.createdAt,
            realizedAt: DateTime.now(),
            issuedAt: DateTime.now(),
            technician: {
              id: technician.id,
              name: technician.name,
            },
            attachments: [],
          },
        });
      }
    });
  }

  private async uploadPhoto(file: MultipartFileContract) {
    const key = `${v4()}.${file.extname}`;
    await file.moveToDisk(
      'timeline',
      {
        name: key,
      },
      'local',
    );

    const url = await Drive.getUrl(`timeline/${key}`);

    return {
      url,
      filename: file.clientName,
    };
  }
}
