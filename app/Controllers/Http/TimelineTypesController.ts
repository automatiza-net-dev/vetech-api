import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import TimelineTypeService from 'App/Services/TimelineTypeService';

@inject()
export default class TimelineTypesController {
  constructor(private readonly service: TimelineTypeService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }
}
