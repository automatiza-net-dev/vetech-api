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
    const qs = request.qs();
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        name: qs.name,
        description: qs.description,
        type: qs.type,
        active: qs.active,
      },
    );

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateExamValidator);

    const result = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateExamValidator);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
