import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import UnitService from 'App/Services/UnitService';
import CreateUnitValidator from 'App/Validators/Unit/CreateUnitValidator';
import UpdateUnitValidator from 'App/Validators/Unit/UpdateUnitValidator';

@inject()
export default class UnitsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: UnitService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.index(unit_id, user);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, user, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateUnitValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, user, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateUnitValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, user, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, user, params.id);

    return response.noContent();
  }
}
