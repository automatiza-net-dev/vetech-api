import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import { IUpdateBusinessUnit } from 'Contracts/interfaces/UpdateBusinessUnit';

@inject()
export default class BusinessUnitService {
  public async index(): Promise<Array<BusinessUnit>> {
    return BusinessUnit.query().preload('economicGroup');
  }

  public async show(id: string): Promise<BusinessUnit> {
    const unit = await BusinessUnit.find(id);

    if (!unit) {
      throw new ResourceNotFoundException(
        'A unidade não foi encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return unit;
  }

  public async update(
    id: string,
    data: IUpdateBusinessUnit,
  ): Promise<BusinessUnit> {
    const unit = await this.show(id);

    return unit.merge(data).save();
  }
}
