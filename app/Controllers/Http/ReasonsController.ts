import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ReasonService from 'App/Services/ResonService';
import SharedService from 'App/Services/SharedService';
import CreateReasonValidator from 'App/Validators/Reason/CreateReasonValidator';
import UpdateReasonValidator from 'App/Validators/Reason/UpdateReasonValidator';

@inject()
export default class ReasonsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: ReasonService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const reasons = await this.service.index(unit_id, request.qs());

    return response.ok(reasons);
  }

  public async show({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const { id } = request.params();

    const reason = await this.service.show(unit_id, id);

    return response.ok(reason);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(CreateReasonValidator);

    const reason = await this.service.store(unit_id, data);

    return response.created(reason);
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const { id } = request.params();
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(UpdateReasonValidator);

    const reason = await this.service.update(unit_id, id, data);

    return response.ok(reason);
  }

  public async destroy({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const { id } = request.params();

    await this.service.destroy(unit_id, id);

    return response.noContent();
  }
}
