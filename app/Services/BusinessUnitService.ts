import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import User from 'App/Models/User';
import { ICreateBusinessUnit } from 'Contracts/interfaces/ICreateBusinessUnit';
import { IUpdateBusinessUnit } from 'Contracts/interfaces/UpdateBusinessUnit';
import { v4 } from 'uuid';

interface ISearchBusinessUnit {
  identification?: string;
  email?: string;
}

@inject()
export default class BusinessUnitService {
  public async index(data: ISearchBusinessUnit): Promise<Array<BusinessUnit>> {
    const qb = BusinessUnit.query().preload('economicGroup');

    if (data.identification) {
      qb.where('identification', 'ilike', `%${data.identification}%`);
    }

    if (data.email) {
      qb.where('email', 'ilike', `%${data.email}%`);
    }

    return qb;
  }

  public async store(
    user: User,
    data: ICreateBusinessUnit,
  ): Promise<BusinessUnit> {
    const economicGroups = await user.related('economicGroups').query();
    const economicGroup = economicGroups.find(
      eg => eg.id === data.economic_group_id,
    );

    if (!economicGroup) {
      throw new BadRequestException('Grupo econômico inválido');
    }

    return economicGroup.related('businessUnits').create({
      id: v4(),
      ...data,
    });
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

  public async getUserBusinessUnits(user: User): Promise<Array<BusinessUnit>> {
    const entities = await user
      .related('economicGroups')
      .query()
      .preload('businessUnits');

    return entities.map(ent => ent.businessUnits).flat();
  }
}
