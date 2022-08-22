import { inject } from '@adonisjs/fold';
import { IAnimalObservation } from 'App/Models/mongoose/AnimalObservation';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import { IAnimalWeight } from 'App/Models/mongoose/AnimalWeight';
import TimelineType, {
  OBSERVATION_UUID,
  WEIGHT_UUID,
} from 'App/Models/TimelineType';

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
}
