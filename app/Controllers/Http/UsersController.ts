import type {HttpContextContract} from '@ioc:Adonis/Core/HttpContext'
import UserService from "App/Services/UserService";

export default class UsersController {

  constructor(private readonly service: UserService) {}

  public async index({response}: HttpContextContract) {
    return response.ok(this.service.index());
  }

  public async store({request, response}: HttpContextContract) {
    return response.created(this.service.store(request.all()))
  }

  public async show({params, response}: HttpContextContract) {
    const {id} = params;
    return response.ok(this.service.show(this.service.show(id)))
  }

  public async update({params, request, response}: HttpContextContract) {
    const {id} = params;
    return response.ok(this.service.update(id, request.all()));
  }
}
