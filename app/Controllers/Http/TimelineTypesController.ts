import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TimelineTypeService from 'App/Services/TimelineTypeService';

@inject()
export default class TimelineTypesController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: TimelineTypeService,
  ) {}

  public async index({ response, auth }: HttpContextContract) {
    return response.ok(
      await this.service.index(await this.sharedService.getAuthContext(auth)),
    );
  }
}
