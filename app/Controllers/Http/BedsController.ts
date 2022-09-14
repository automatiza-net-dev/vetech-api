import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BedService from 'App/Services/BedService';
import SharedService from 'App/Services/SharedService';
import CreateBedValidator from 'App/Validators/Bed/CreateBedValidator';
import UpdateBedValidator from 'App/Validators/Bed/UpdateBedValidator';

@inject()
export default class BedsController {
  constructor(
    private sharedService: SharedService,
    private service: BedService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const beds = await this.service.index(unit_id);

    return response.ok(beds);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(CreateBedValidator);

    const bed = await this.service.store(unit_id, payload);

    return response.created(bed);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const bed = await this.service.show(unit_id, params.id);

    return response.json(bed);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpdateBedValidator);

    const bed = await this.service.update(unit_id, params.id, payload);

    return response.json(bed);
  }

  public async destroy({ params, auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
