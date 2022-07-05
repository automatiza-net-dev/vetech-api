import { inject } from '@adonisjs/fold';
import SharedService from 'App/Services/SharedService';

@inject()
export default class ScheduleStatusService {
  constructor(private readonly sharedService: SharedService) {}
}
