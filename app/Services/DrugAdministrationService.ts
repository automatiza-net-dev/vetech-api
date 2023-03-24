import { inject } from '@adonisjs/fold';
import DrugAdministration from 'App/Models/DrugAdministration';
import SharedService from 'App/Services/SharedService';
import IDrugAdministrationData from 'Contracts/interfaces/IDrugAdministrationData';

@inject()
export default class DrugAdministrationService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);
    return DrugAdministration.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null)',
      [group.id],
    );
  }

  public async store(
    unitId: string,
    data: Omit<IDrugAdministrationData, 'active'>,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return DrugAdministration.create({
      description: data.description,
      economic_group_id: group.id,
    });
  }

  public async show(unitId: string, id: string) {
    const ent = await DrugAdministration.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    const group = await this.sharedService.getUserGroup(unitId);

    if (ent.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(
    unitId: string,
    id: string,
    data: IDrugAdministrationData,
  ) {
    const entity = await this.show(unitId, id);

    return entity
      .merge({
        description: data.description,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    await entity.softDelete();
  }
}
