import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnitService from 'App/Services/BusinessUnitService';
import SharedService from 'App/Services/SharedService';
import UserRoleService from 'App/Services/UserRoleService';
import CreateBusinessUnitValidator from 'App/Validators/BusinessUnit/CreateBusinessUnitValidator';
import UpdateBusinessUnitValidator from 'App/Validators/BusinessUnit/UpdateBusinessUnitValidator';

@inject()
export default class BusinessUnitsController {
  constructor(
    private readonly service: BusinessUnitService,
    private readonly userRoleService: UserRoleService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
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

  public async users({ params, response }: HttpContextContract) {
    const { id } = params;
    const users = await this.userRoleService.getUnitUsers(id);

    return response.ok(users);
  }

  public async user({ auth, response }: HttpContextContract) {
    const { user } = this.sharedService.extractUser(auth);

    const groups = await this.service.getUserBusinessUnits(user);

    return response.ok(groups);
  }
}
