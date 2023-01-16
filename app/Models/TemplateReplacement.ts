import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum TemplateReplacementOrigin {
  PATIENTS = 'PATIENTS',
  RACES = 'RACES',
  USERS = 'USERS',
  BUSINESS_UNITS = 'BUSINESS_UNITS',
  SYSTEM = 'SYSTEM',
}

export default class TemplateReplacement extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public origin: TemplateReplacementOrigin;

  @column()
  public attribute: string;

  @column()
  public replacer: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;
}
