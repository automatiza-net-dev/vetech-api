// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import WorkingDayService from 'App/Services/WorkingDayService';

@inject()
export default class WorkingDaysController {
  constructor(private readonly service: WorkingDayService) {}
}
