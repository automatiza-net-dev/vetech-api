import { inject } from '@adonisjs/fold';
import AnimalTimeline from 'App/Models/mongoose/AnimalTimeline';
import { IAnimalWeight } from 'App/Models/mongoose/AnimalWeight';
import TimelineType, { WEIGHT_UUID } from 'App/Models/TimelineType';

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
}
