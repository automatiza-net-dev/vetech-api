import { inject } from '@adonisjs/fold';
import TimelineType from 'App/Models/TimelineType';

@inject()
export default class TimelineTypeService {
  public async index() {
    return TimelineType.all();
  }
}
