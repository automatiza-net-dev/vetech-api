import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import UserService from 'App/Services/UserService';
import CreateUserValidator from 'App/Validators/User/CreateUserValidator';
import UpdateUserValidator from 'App/Validators/User/UpdateUserValidator';

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
    const user = await this.service.show(id);
    return response.ok(user);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdateUserValidator);
    const updatedUser = await this.service.update(id, payload);
    return response.ok(updatedUser);
  }

  public async destroy({ params, response }: HttpContextContract) {
    const { id } = params;
    await this.service.delete(id);
    return response.noContent();
  }
}
