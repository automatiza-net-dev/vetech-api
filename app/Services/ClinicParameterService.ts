import { inject } from '@adonisjs/fold';
import ClinicParameter from 'App/Models/ClinicParameter';
import SharedService from 'App/Services/SharedService';
import IClinicParameterData from 'Contracts/interfaces/IClinicParameterData';

@inject()
export default class ClinicParameterService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    return ClinicParameter.query().whereRaw(
      '(economic_group_id = ? or economic_group_id is null) and deleted_at is null',
      [group.id],
    );
  }

  public async store(
    unitId: string,
    data: Omit<IClinicParameterData, 'active'>,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return ClinicParameter.create({
      name: data.name,
      tag: data.tag,
      economic_group_id: group.id,
    });
  }

  public async show(unitId: string, id: string) {
    const ent = await ClinicParameter.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!ent.economic_group_id) {
      return ent;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (ent.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(unitId: string, id: string, data: IClinicParameterData) {
    const entity = await this.show(unitId, id);

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

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    if (!entity.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return entity.delete();
  }
}
