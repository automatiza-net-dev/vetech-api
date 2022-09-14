import { inject } from '@adonisjs/fold';
import ClinicParameter from 'App/Models/ClinicParameter';
import SharedService from 'App/Services/SharedService';
import IClinicParameterData from 'Contracts/interfaces/IClinicParameterData';

@inject()
export default class ClinicParameterService {
  constructor(private sharedService: SharedService) {}

  public async index() {
    return ClinicParameter.query();
  }

  public async store(data: Omit<IClinicParameterData, 'active'>) {
    return ClinicParameter.create({
      name: data.name,
      tag: data.tag,
    });
  }

  public async show(id: string) {
    const ent = await ClinicParameter.find(id);

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(id: string, data: IClinicParameterData) {
    const entity = await this.show(id);

    return entity
      .merge({
        name: data.name,
        tag: data.tag,
        active: data.active,
      })
      .save();
  }

  public async destroy(id: string) {
    const entity = await this.show(id);

    return entity.delete();
  }
}
