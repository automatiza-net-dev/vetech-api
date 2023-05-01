import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Exam from 'App/Models/Exam';
import SharedService, { AuthContext } from 'App/Services/SharedService';
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

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = Exam.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id);

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

    // TODO paginate
    return qb;
  }

  public async store(authCtx: AuthContext, data: Omit<IExamData, 'active'>) {
    return Exam.create({
      name: data.name,
      description: data.description,
      economic_group_id: authCtx.group.id,
      subgroup_id: data.subgroupId,
      ownLaboratory: data.ownLaboratory,
      type: data.type,
    });
  }

  public async show(authCtx: AuthContext, id: string) {
    const exam = await Exam.find(id);

    if (!exam || exam.system_id !== authCtx.system.id) {
      throw new ResourceNotFoundException(
        'Exame não encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    if (!exam.economic_group_id) {
      return exam;
    }

    if (authCtx.group.id !== exam.economic_group_id) {
      throw new ResourceNotFoundException(
        'Exame não encontrada',
        404,
        'E_NOT_FOUND',
      );
    }

    return exam;
  }

  public async update(authCtx: AuthContext, id: string, data: IExamData) {
    const exam = await this.show(authCtx, id);

    if (!exam.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

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

  public async destroy(authCtx: AuthContext, id: string) {
    const exam = await this.show(authCtx, id);

    if (!exam.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    await exam.softDelete();
  }
}
