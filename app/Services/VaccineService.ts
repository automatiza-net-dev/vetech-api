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
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Vaccine.query().preload('protocols', query => {
      query.select('id', 'name', 'doses', 'interval', 'active', 'specie_id');

      query.preload('specie', query => {
        query.select('id', 'description');
      });
    });

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (!isSuperAdmin) {
      qb.where('economic_group_id', group.id);
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
    const group = await this.sharedService.getUserGroup(unitId);

    return Vaccine.create({
      name: data.name,
      description: data.description,
      economic_group_id: isSuperAdmin ? undefined : group.id,
      subgroup_id: data.subgroupId,
      type: data.type,
    });
  }

  public async show(unitId: string, id: string, _: User) {
    const vaccine = await Vaccine.find(id);

    if (!vaccine) {
      throw new ResourceNotFoundException(
        'Vacina não encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    if (!vaccine.economic_group_id) {
      return vaccine;
    }

    const group = await this.sharedService.getUserGroup(unitId);
    if (group.id !== vaccine.economic_group_id) {
      throw new ResourceNotFoundException(
        'Vacina não encontrada',
        404,
        'E_NOT_FOUND',
      );
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

    if (!vaccine.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    return vaccine
      .merge({
        name: data.name,
        description: data.description,
        subgroup_id: data.subgroupId,
        active: data.active,
        type: data.type,
      })
      .save();
  }

  public async destroy(unitId: string, user: User, id: string) {
    const vaccine = await this.show(unitId, id, user);

    if (!vaccine.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await vaccine.softDelete();
  }
}
