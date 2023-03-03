import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import Database from '@ioc:Adonis/Lucid/Database';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import { IAnimalDocument } from 'App/Models/mongoose/AnimalDocument';
import { IAnimalPathology } from 'App/Models/mongoose/AnimalPathology';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import { IAnimalWeight } from 'App/Models/mongoose/AnimalWeight';
import HospitalizationTimeline from 'App/Models/mongoose/HospitalizationTimeline';
import Patient, { PatientWeightOrigin } from 'App/Models/Patient';
import PatientExam from 'App/Models/PatientExam';
import PatientVaccine from 'App/Models/PatientVaccine';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import TimelineType, {
  ATTENDANCE_UUID,
  DOCUMENT_UUID,
  EXAM_UUID,
  HOSPITALIZATION_UUID,
  OBSERVATION_UUID,
  PATHOLOGY_UUID,
  PHOTO_UUID,
  RECIPE_UUID,
  VACCINE_UUID,
  WEIGHT_UUID,
} from 'App/Models/TimelineType';
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
    });
  }

  public async weightIndex(tag: string) {
    return AnimalTimeline.find({
      timeline_id: WEIGHT_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeWeight(data: IAnimalWeight) {
    const timelineInfo = await TimelineType.findOrFail(WEIGHT_UUID);

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
        timeline_id: WEIGHT_UUID,
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
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const timelineInfo = await TimelineType.findOrFail(WEIGHT_UUID);
    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        timeline_id: WEIGHT_UUID,
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
  }

  public async documentIndex(tag: string) {
    return AnimalTimeline.find({
      timeline_id: DOCUMENT_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeDocument(data: IAnimalDocument) {
    const timelineInfo = await TimelineType.findOrFail(DOCUMENT_UUID);

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: DOCUMENT_UUID,
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

    const timelineInfo = await TimelineType.findOrFail(DOCUMENT_UUID);

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        timeline_id: DOCUMENT_UUID,
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
    return AnimalTimeline.find({
      timeline_id: PATHOLOGY_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storePathology(data: IAnimalPathology) {
    const timelineInfo = await TimelineType.findOrFail(PATHOLOGY_UUID);

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: PATHOLOGY_UUID,
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
    return AnimalTimeline.find({
      timeline_id: RECIPE_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeMedicalRecipe(data: IAnimalMedicalRecipe) {
    const timelineInfo = await TimelineType.findOrFail(RECIPE_UUID);

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: RECIPE_UUID,
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

    const timelineInfo = await TimelineType.findOrFail(RECIPE_UUID);

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        timeline_id: RECIPE_UUID,
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
    return AnimalTimeline.find({
      timeline_id: PHOTO_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storePhoto(data: ICreateAnimalPhoto) {
    const timelineInfo = await TimelineType.findOrFail(PHOTO_UUID);

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: PHOTO_UUID,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        photo: await this.uploadPhoto(data.photo),
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
    return AnimalTimeline.find({
      timeline_id: VACCINE_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeVaccine(data: ICreateAnimalVaccine) {
    const timelineInfo = await TimelineType.findOrFail(VACCINE_UUID);

    const technician = await User.findOrFail(data.technicianId);
    const vaccine = await PatientVaccine.findOrFail(data.vaccineId);
    await vaccine.load('calendars');

    return AnimalTimeline.create({
      timeline_id: VACCINE_UUID,
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
    return AnimalTimeline.find({
      timeline_id: EXAM_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeExam(data: ICreateAnimalExam) {
    const timelineInfo = await TimelineType.findOrFail(EXAM_UUID);

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
      timeline_id: EXAM_UUID,
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
    return AnimalTimeline.find({
      timeline_id: ATTENDANCE_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeAppointment(data: ICreateAppointment) {
    const timelineInfo = await TimelineType.findOrFail(ATTENDANCE_UUID);
    const serviceType = await ScheduleServiceType.findOrFail(
      data.scheduleServiceId,
    );

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: ATTENDANCE_UUID,
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
    return HospitalizationTimeline.find({
      timeline_id: HOSPITALIZATION_UUID,
      'patient.id': tag,
    });
  }

  // public async storeHospitalization(data: ICreateTimelineHospitalization) {
  //   const timelineInfo = await TimelineType.findOrFail(HOSPITALIZATION_UUID);

  //   const technician = await User.findOrFail(data.technicianId);

  //   return AnimalTimeline.create({
  //     timeline_id: HOSPITALIZATION_UUID,
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
    const timelineInfo = await TimelineType.findOrFail(HOSPITALIZATION_UUID);

    const technician = await User.findOrFail(data.technicianId);

    return AnimalTimeline.create({
      timeline_id: HOSPITALIZATION_UUID,
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
    return AnimalTimeline.find({
      timeline_id: OBSERVATION_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeObservations(data: ICreateObservation) {
    const timelineInfo = await TimelineType.findOrFail(OBSERVATION_UUID);

    const technician = await User.findOrFail(data.technicianId);

    const medias = data.medias
      ? await Promise.all(data.medias.map(this.uploadPhoto))
      : [];

    return AnimalTimeline.create({
      timeline_id: OBSERVATION_UUID,
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
  }

  public async updateObservations(id: string, data: ICreateObservation) {
    const record = await AnimalTimeline.findById(id);

    if (!record) {
      throw new ResourceNotFoundException('Recurso não encontrado');
    }

    const timelineInfo = await TimelineType.findOrFail(OBSERVATION_UUID);

    const technician = await User.findOrFail(data.technicianId);

    const medias = data.medias
      ? await Promise.all(data.medias.map(this.uploadPhoto))
      : [];

    return AnimalTimeline.findByIdAndUpdate(id, {
      $set: {
        timeline_id: OBSERVATION_UUID,
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
      },
    });
  }

  private async uploadPhoto(file: MultipartFileContract): Promise<string> {
    const key = `${v4()}.${file.extname}`;
    await file.moveToDisk(
      'timeline',
      {
        name: key,
      },
      'local',
    );

    return Drive.getUrl(`timeline/${key}`);
  }
}
