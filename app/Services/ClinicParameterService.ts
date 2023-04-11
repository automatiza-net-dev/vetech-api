import { inject } from '@adonisjs/fold';
import ClinicParameter from 'App/Models/ClinicParameter';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IClinicParameterData from 'Contracts/interfaces/IClinicParameterData';

@inject()
export default class ClinicParameterService {
  constructor(private sharedService: SharedService) {}

  public async index(authCtx: AuthContext) {
    return ClinicParameter.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null) and deleted_at is null',
      [authCtx.group.id],
    );
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<IClinicParameterData, 'active'>,
  ) {
    return ClinicParameter.create({
      name: data.name,
      tag: data.tag,
      economic_group_id: authCtx.group.id,
    });
  }

  public async show(authCtx: AuthContext, id: string) {
    const ent = await ClinicParameter.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!ent.economic_group_id) {
      return ent;
    }

    if (ent.system_id !== authCtx.system.id) {
      throw this.sharedService.ResourceNotFound();
    }

    if (ent.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IClinicParameterData,
  ) {
    const entity = await this.show(authCtx, id);

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return entity
      .merge({
        name: data.name,
        tag: data.tag,
        active: data.active,
      })
      .save();
  }

  public async destroy(authCtx: AuthContext, id: string) {
    const entity = await this.show(authCtx, id);

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    if (entity.system_id !== authCtx.system.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return entity.delete();
  }
}
