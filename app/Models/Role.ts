import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import Permission from 'App/Models/Permission';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

export const RoleType = ['system', 'controller'] as const;
export type TRoleType = typeof RoleType[number];

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public name: string;

  @column()
  public type: TRoleType;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }

  @column({
    serializeAs: null,
  })
  public system_id: number;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;

  @manyToMany(() => Permission, {
    pivotTable: 'role_permissions',
    pivotTimestamps: true,
    pivotColumns: ['active'],
  })
  public permissions: ManyToMany<typeof Permission>;
}
