import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Exam from 'App/Models/Exam';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { IExamData } from 'Contracts/interfaces/IExamData';

interface ISearch {
  name?: string;
  description?: string;
  active?: string;
  type?: string;
}

@inject()
export default class ExamService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, user: User, data: ISearch) {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Exam.query();

    if (data.name) {
      qb.where('name', 'ilike', `%${data.name}%`);
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.type) {
      qb.where('type', 'ilike', `%${data.type}%`);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
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
    data: Omit<IExamData, 'active'>,
  ) {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);
    const group = await this.sharedService.getUserGroup(unitId);

    return Exam.create({
      name: data.name,
      description: data.description,
      economic_group_id: isSuperAdmin ? undefined : group.id,
      subgroup_id: data.subgroupId,
      ownLaboratory: data.ownLaboratory,
      type: data.type,
    });
  }

  public async show(unitId: string, id: string, user: User) {
    const exam = await Exam.find(id);

    if (!exam) {
      throw new ResourceNotFoundException(
        'Exame não encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    const group = await this.sharedService.getUserGroup(unitId);

    if (exam.economic_group_id) {
      const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

      if (!isSuperAdmin) {
        if (group.id !== exam.economic_group_id) {
          throw new ResourceNotFoundException(
            'Exame não encontrada',
            404,
            'E_NOT_FOUND',
          );
        }
      }
    }

    return exam;
  }

  public async update(unitId: string, user: User, id: string, data: IExamData) {
    const exam = await this.show(unitId, id, user);

    return exam
      .merge({
        name: data.name,
        description: data.description,
        subgroup_id: data.subgroupId,
        active: data.active,
        ownLaboratory: data.ownLaboratory,
        type: data.type,
      })
      .save();
  }

  public async destroy(unitId: string, user: User, id: string) {
    const exam = await this.show(unitId, id, user);

    await exam.softDelete();
  }
}
