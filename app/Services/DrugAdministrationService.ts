import { inject } from '@adonisjs/fold';
import DrugAdministration from 'App/Models/DrugAdministration';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IDrugAdministrationData from 'Contracts/interfaces/IDrugAdministrationData';

@inject()
export default class DrugAdministrationService {
  constructor(private sharedService: SharedService) {}

  public async index(authCtx: AuthContext) {
    return DrugAdministration.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [authCtx.group.id],
    );
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<IDrugAdministrationData, 'active'>,
  ) {
    return DrugAdministration.create({
      description: data.description,
      economic_group_id: authCtx.group.id,
    });
  }

  public async show(authCtx: AuthContext, id: string) {
    const ent = await DrugAdministration.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!ent.economic_group_id) {
      return ent;
    }

    if (ent.economic_group_id !== authCtx.group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(
    authCtx: AuthContext,
    id: string,
    data: IDrugAdministrationData,
  ) {
    const entity = await this.show(authCtx, id);

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return entity
      .merge({
        description: data.description,
        active: data.active,
      })
      .save();
  }

  public async destroy(authCtx: AuthContext, id: string) {
    const entity = await this.show(authCtx, id);

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await entity.softDelete();
  }
}
