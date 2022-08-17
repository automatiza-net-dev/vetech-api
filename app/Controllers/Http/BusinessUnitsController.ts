import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnitService from 'App/Services/BusinessUnitService';
import SharedService from 'App/Services/SharedService';
import UserRoleService from 'App/Services/UserRoleService';
import CreateBusinessUnitValidator from 'App/Validators/BusinessUnit/CreateBusinessUnitValidator';
import UpdateBusinessUnitValidator from 'App/Validators/BusinessUnit/UpdateBusinessUnitValidator';
import UpdateUnitUserValidator from 'App/Validators/BusinessUnit/UpdateUnitUserValidator';

@inject()
export default class BusinessUnitsController {
  constructor(
    private readonly service: BusinessUnitService,
    private readonly userRoleService: UserRoleService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ request, response }: HttpContextContract) {
    const qs = request.qs();
    return response.ok(
      await this.service.index({
        email: qs.email,
        identification: qs.identification,
      }),
    );
  }

  public async show({ params, response }: HttpContextContract) {
    return response.ok(await this.service.show(params.id));
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateBusinessUnitValidator);
    const { user } = this.sharedService.extractUser(auth);

    const unit = await this.service.store(user, payload);

    return response.created(unit);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdateBusinessUnitValidator);
    const updatedUnit = await this.service.update(id, payload);

    return response.ok(updatedUnit);
  }

  public async updateUser({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdateUnitUserValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const updatedUnit = await this.service.updateUser(
      unit_id,
      user,
      id,
      payload,
    );

    return response.ok(updatedUnit);
  }

  public async users({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const users = await this.userRoleService.getUnitUsers(unit_id, {
      name: qs.name,
      document: qs.document,
      phone: qs.phone,
      role: qs.role,
    });

    return response.ok(users);
  }

  public async user({ auth, response }: HttpContextContract) {
    const { user } = this.sharedService.extractUser(auth);

    const groups = await this.service.getUserBusinessUnits(user);

    return response.ok(groups);
  }

  public async deleteUser({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.userRoleService.deleteUserFromBusiness(unit_id, params.id);

    return response.noContent();
  }
}
