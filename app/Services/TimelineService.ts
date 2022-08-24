import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import { IAnimalDocument } from 'App/Models/mongoose/AnimalDocument';
import { IAnimalObservation } from 'App/Models/mongoose/AnimalObservation';
import { IAnimalPathology } from 'App/Models/mongoose/AnimalPathology';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import { IAnimalWeight } from 'App/Models/mongoose/AnimalWeight';
import TimelineType, {
  DOCUMENT_UUID,
  OBSERVATION_UUID,
  PATHOLOGY_UUID,
  PHOTO_UUID,
  RECIPE_UUID,
  VACCINE_UUID,
  WEIGHT_UUID,
} from 'App/Models/TimelineType';
import ICreateAnimalPhoto from 'Contracts/interfaces/ICreateAnimalPhoto';
import ICreateAnimalVaccine from 'Contracts/interfaces/ICreateAnimalVaccine';
import { v4 } from 'uuid';

import { IAnimalMedicalRecipe } from '../Models/mongoose/AnimalMedicalRecipe';

@inject()
export default class TimelineService {
  public async weightIndex(tag: string) {
    return AnimalTimeline.find({
      timeline_id: WEIGHT_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeWeight(data: IAnimalWeight) {
    const timelineInfo = await TimelineType.findOrFail(WEIGHT_UUID);
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
        observation: data.observation ?? '',
      },
    });
  }

  public async observationIndex(tag: string) {
    return AnimalTimeline.find({
      timeline_id: OBSERVATION_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeObservation(data: IAnimalObservation) {
    const timelineInfo = await TimelineType.findOrFail(OBSERVATION_UUID);
    return AnimalTimeline.create({
      timeline_id: OBSERVATION_UUID,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        observation: data.observation,
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
        observation: data.observation ?? '',
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
        observation: data.observation ?? '',
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
    return AnimalTimeline.create({
      timeline_id: RECIPE_UUID,
      timeline_type: {
        description: timelineInfo.description,
        color: timelineInfo.color,
        requires_observation: timelineInfo.requiresObservation,
      },
      timeline_info: {
        tag: data.tag,
        recipe: data.recipe,
        observation: data.observation ?? '',
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
      },
    });
  }

  public async vaccineIndex(tag: string) {
    return AnimalTimeline.find({
      timeline_id: VACCINE_UUID,
      'timeline_info.tag': tag,
    });
  }

  public async storeVaccine(data: ICreateAnimalVaccine) {
    const timelineInfo = await TimelineType.findOrFail(VACCINE_UUID);
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
        description: data.description,
        observation: data.observation ?? '',
      },
    });
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
