import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import KitService from 'App/Services/KitService';
import SharedService from 'App/Services/SharedService';
import CreateKitValidator from 'App/Validators/Kit/CreateKitValidator';
import UpdateKitValidator from 'App/Validators/Kit/UpdateKitValidator';

@inject()
export default class KitsController {
  constructor(
    private sharedService: SharedService,
    private service: KitService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const beds = await this.service.index(unit_id, {
      description: qs.description,
    });

    return response.ok(beds);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(CreateKitValidator);

    const model = await this.service.store(unit_id, payload);

    return response.created(model);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const model = await this.service.show(unit_id, params.id);

    return response.json(model);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpdateKitValidator);

    const model = await this.service.update(unit_id, params.id, payload);

    return response.json(model);
  }

  public async destroy({ params, auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
