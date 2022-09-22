import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ExamService from 'App/Services/ExamService';
import SharedService from 'App/Services/SharedService';
import CreateExamValidator from 'App/Validators/Exam/CreateExamValidator';
import UpdateExamValidator from 'App/Validators/Exam/UpdateExamValidator';

@inject()
export default class ExamsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: ExamService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, user, {
      name: qs.name,
      description: qs.description,
      type: qs.type,
      active: qs.active,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id, user);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateExamValidator);
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
    const payload = await request.validate(UpdateExamValidator);
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
