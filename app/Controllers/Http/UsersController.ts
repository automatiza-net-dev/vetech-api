import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import UserService from 'App/Services/UserService';
import CreateUserValidator from 'App/Validators/User/CreateUserValidator';

@inject()
export default class UsersController {
  constructor(private readonly service: UserService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateUserValidator);
    const created = await this.service.store(payload);
    return response.created(created);
  }

  public async show({ params, response }: HttpContextContract) {
    const { id } = params;
    return response.ok(this.service.show(this.service.show(id)));
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { id } = params;
    return response.ok(this.service.update(id, request.all()));
  }
}
