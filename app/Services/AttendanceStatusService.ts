import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import AttendanceStatus from 'App/Models/AttendanceStatus';
import BusinessUnit from 'App/Models/BusinessUnit';
import IAttendanceStatusData from 'Contracts/interfaces/IAttendanceStatusData';

interface ISearch {
  description?: string;
}

@inject()
export default class AttendanceStatusService {
  // TODO paginate
  public async index(unitId: string, data: ISearch) {
    const qb = AttendanceStatus.query().where('business_unit_id', unitId);

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    const status = await AttendanceStatus.query()
      .where('business_unit_id', unitId)
      .andWhere('id', id)
      .first();

    if (!status) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return status;
  }

  public async store(
    unitId: string,
    data: Omit<IAttendanceStatusData, 'active'>,
  ) {
    const unit = await BusinessUnit.findOrFail(unitId);

    return unit.related('attendanceStatuses').create({
      description: data.description,
      color: data.color,
    });
  }

  public async update(unitId: string, id: string, data: IAttendanceStatusData) {
    const status = await this.show(unitId, id);

    return status
      .merge({
        description: data.description,
        color: data.color,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const status = await this.show(unitId, id);

    await status.softDelete();
  }
}
