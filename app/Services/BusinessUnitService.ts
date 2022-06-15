import { inject } from '@adonisjs/fold';
import BusinessUnit from 'App/Models/BusinessUnit';

@inject()
export default class BusinessUnitService {
  public async index(): Promise<Array<BusinessUnit>> {
    return BusinessUnit.query().preload('economicGroup');
  }
}
