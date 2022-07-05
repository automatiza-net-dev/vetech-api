// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import ScheduleServiceTypeService from 'App/Services/ScheduleServiceTypeService';

@inject()
export default class ScheduleServiceTypesController {
  constructor(private readonly service: ScheduleServiceTypeService) {}
}
