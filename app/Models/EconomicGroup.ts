import {
  BaseModel,
  column,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

export default class EconomicGroup extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column({
    columnName: 'fantasy_name',
  })
  public fantasyName: string;

  @column({
    columnName: 'company_name',
  })
  public companyName: string;

  @column({})
  public document: string;

  @column({
    columnName: 'responsible_email',
  })
  public responsibleEmail: string;

  @column({
    columnName: 'responsible_phone',
  })
  public responsiblePhone: string;

  @manyToMany(() => User, {
    pivotTable: 'users_economic_groups',
    pivotTimestamps: true,
  })
  public users: ManyToMany<typeof User>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
