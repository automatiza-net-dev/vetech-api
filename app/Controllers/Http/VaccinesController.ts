import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import VaccineService from 'App/Services/VaccineService';
import CreateVaccineValidator from 'App/Validators/Vaccine/CreateVaccineValidator';
import UpdateVaccineValidator from 'App/Validators/Vaccine/UpdateVaccineValidator';

@inject()
export default class VaccinesController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: VaccineService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, user, {
      name: qs.name,
      description: qs.description,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id, user);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateVaccineValidator);
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
    const payload = await request.validate(UpdateVaccineValidator);
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
