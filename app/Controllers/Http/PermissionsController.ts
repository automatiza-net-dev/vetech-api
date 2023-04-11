import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PermissionService from 'App/Services/PermissionService';
import SharedService from 'App/Services/SharedService';
import CreatePermissionValidator from 'App/Validators/Permission/CreatePermissionValidator';
import UpdatePermissionValidator from 'App/Validators/Permission/UpdatePermissionValidator';

@inject()
export default class PermissionsController {
  constructor(
    private sharedService: SharedService,
    private readonly service: PermissionService,
  ) {}

  public async index({ request, response, auth }: HttpContextContract) {
    const qs = request.qs();

    return response.ok(
      await this.service.index(await this.sharedService.getAuthContext(auth), {
        name: qs.name,
      }),
    );
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const payload = await request.validate(CreatePermissionValidator);
    const newPermission = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(newPermission);
  }

  public async show({ params, response, auth }: HttpContextContract) {
    const { id } = params;
    return response.ok(
      await this.service.show(
        await this.sharedService.getAuthContext(auth),
        id,
      ),
    );
  }

  public async update({
    params,
    request,
    response,
    auth,
  }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdatePermissionValidator);
    const updatedPermission = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      id,
      payload,
    );

    return response.ok(updatedPermission);
  }

  public async destroy({ params, response, auth }: HttpContextContract) {
    const { id } = params;
    await this.service.delete(
      await this.sharedService.getAuthContext(auth),
      id,
    );
    return response.noContent();
  }
}
