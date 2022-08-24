import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import User from 'App/Models/User';
import Vaccine from 'App/Models/Vaccine';
import SharedService from 'App/Services/SharedService';
import { IVaccineData } from 'Contracts/interfaces/IVaccineData';

interface ISearch {
  name?: string;
  description?: string;
}

@inject()
export default class VaccineService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, user: User, data: ISearch) {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    const qb = Vaccine.query();

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (!isSuperAdmin) {
      qb.where('business_unit_id', unitId);
    }

    // TODO paginate
    return qb;
  }

  public async store(
    unitId: string,
    user: User,
    data: Omit<IVaccineData, 'active'>,
  ) {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    return Vaccine.create({
      name: data.name,
      description: data.description,
      business_unit_id: isSuperAdmin ? undefined : unitId,
      subgroup_id: data.subgroupId,
    });
  }

  public async show(unitId: string, id: string, user: User) {
    const vaccine = await Vaccine.find(id);

    if (!vaccine) {
      throw new ResourceNotFoundException(
        'Vacina não encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    if (vaccine.business_unit_id) {
      const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

      if (!isSuperAdmin) {
        if (unitId !== vaccine.business_unit_id) {
          throw new ResourceNotFoundException(
            'Vacina não encontrada',
            404,
            'E_NOT_FOUND',
          );
        }
      }
    }

    return vaccine;
  }

  public async update(
    unitId: string,
    user: User,
    id: string,
    data: IVaccineData,
  ) {
    const vaccine = await this.show(unitId, id, user);

    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    return vaccine.merge({
      name: data.name,
      description: data.description,
      business_unit_id: isSuperAdmin ? undefined : unitId,
      subgroup_id: data.subgroupId,
      active: data.active,
    });
  }

  public async destroy(unitId: string, user: User, id: string) {
    const vaccine = await this.show(unitId, id, user);

    await vaccine.softDelete();
  }
}
