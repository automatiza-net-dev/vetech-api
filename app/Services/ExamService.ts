import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Exam from 'App/Models/Exam';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { IExamData } from 'Contracts/interfaces/IExamData';

interface ISearch {
  name?: string;
  description?: string;
}

@inject()
export default class ExamService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, user: User, data: ISearch) {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    const qb = Exam.query();

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
    data: Omit<IExamData, 'active'>,
  ) {
    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    return Exam.create({
      name: data.name,
      description: data.description,
      business_unit_id: isSuperAdmin ? undefined : unitId,
      subgroup_id: data.subgroupId,
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

    if (exam.business_unit_id) {
      const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

      if (!isSuperAdmin) {
        if (unitId !== exam.business_unit_id) {
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

    const isSuperAdmin = await this.sharedService.isSuperAdmin(user);

    return exam.merge({
      name: data.name,
      description: data.description,
      business_unit_id: isSuperAdmin ? undefined : unitId,
      subgroup_id: data.subgroupId,
      active: data.active,
    });
  }

  public async destroy(unitId: string, user: User, id: string) {
    const exam = await this.show(unitId, id, user);

    await exam.softDelete();
  }
}
