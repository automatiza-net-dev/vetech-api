import { inject } from '@adonisjs/fold';
import TaxOperation from 'App/Models/TaxOperation';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import ITaxOperation from 'Contracts/interfaces/ITaxOperationData';

interface ISearch {
  type?: string;
  category?: string;
}

@inject()
export default class TaxOperationService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, user: User, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    const query = TaxOperation.query();

    if (!isSuperAdmin) {
      query.whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        group.id,
      ]);
    }

    if (data.type) {
      query.where('movement_type', data.type);
    }

    if (data.category) {
      query.where('movement_category', data.category);
    }

    return query;
  }

  public async store(
    unitId: string,
    user: User,
    data: Omit<ITaxOperation, 'active'>,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    const values: Partial<TaxOperation> = {
      code: data.code,
      description: data.description,
      movementType: data.movementType,
      movementCategory: data.movementCategory,
      generatesFinancial: data.generatesFinancial,
      financialTrouble: data.financialTrouble,
      active: true,
    };

    if (!isSuperAdmin) {
      values.economic_group_id = group.id;
    }

    return TaxOperation.create(values);
  }

  public async show(unitId: string, user: User, id: string) {
    const tax = await TaxOperation.find(id);

    if (!tax) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!tax.economic_group_id) {
      return tax;
    }

    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    if (isSuperAdmin) {
      return tax;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (group.id !== tax.economic_group_id) {
      throw this.sharedService.ResourceNotFound();
    }

    return tax;
  }

  public async update(
    unitId: string,
    user: User,
    id: string,
    data: ITaxOperation,
  ) {
    const tax = await this.show(unitId, user, id);

    tax.merge(data);

    return tax.save();
  }

  public async destroy(unitId: string, user: User, id: string) {
    const tax = await this.show(unitId, user, id);

    return tax.softDelete();
  }
}
