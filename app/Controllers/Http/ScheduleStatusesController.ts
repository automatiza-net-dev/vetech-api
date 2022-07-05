// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import ScheduleStatusService from 'App/Services/ScheduleStatusService';

@inject()
export default class ScheduleStatusesController {
  constructor(private readonly service: ScheduleStatusService) {}
}
