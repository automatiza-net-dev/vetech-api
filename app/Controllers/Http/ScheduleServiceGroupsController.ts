// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import ScheduleServiceGroupService from 'App/Services/ScheduleServiceGroupService';

@inject()
export default class ScheduleServiceGroupsController {
  constructor(private readonly service: ScheduleServiceGroupService) {}
}
