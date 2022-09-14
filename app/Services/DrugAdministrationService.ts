import { inject } from '@adonisjs/fold';
import DrugAdministration from 'App/Models/DrugAdministration';
import SharedService from 'App/Services/SharedService';
import IDrugAdministrationData from 'Contracts/interfaces/IDrugAdministrationData';

@inject()
export default class DrugAdministrationService {
  constructor(private sharedService: SharedService) {}

  public async index() {
    return DrugAdministration.query();
  }

  public async store(data: Omit<IDrugAdministrationData, 'active'>) {
    return DrugAdministration.create({
      description: data.description,
    });
  }

  public async show(id: string) {
    const ent = await DrugAdministration.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(id: string, data: IDrugAdministrationData) {
    const entity = await this.show(id);

    return entity
      .merge({
        description: data.description,
        active: data.active,
      })
      .save();
  }

  public async destroy(id: string) {
    const entity = await this.show(id);

    await entity.softDelete();
  }
}
