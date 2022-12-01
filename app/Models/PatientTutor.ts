import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import ClientOrigin from 'App/Models/ClientOrigin';
import Patient from 'App/Models/Patient';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export const TutorResidences = [
  'CASA',
  'APARTAMENTO',
  'CONDOMINIO',
  'SITIO',
  'COMERCIAL',
] as const;
export default class PatientTutor extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public residence: typeof TutorResidences[number];

  @column()
  public document?: string;

  @column()
  public inscription?: string; // ie/rg

  @column({
    columnName: 'corporate_name',
  })
  public corporateName?: string;

  @column()
  public email: string;

  @column()
  public cellphone: string;

  @column()
  public telephone?: string;

  @column({
    columnName: 'message_person_name',
  })
  public messagePersonName?: string;

  @column({
    columnName: 'message_person_phone',
  })
  public messagePersonPhone?: string;

  @column()
  public postalCode?: string;

  @column()
  public patient_id: string;

  @column()
  public street?: string;

  @column()
  public number?: string;

  @column()
  public complement?: string;

  @column()
  public district?: string;

  @column()
  public city?: string;

  @column()
  public state?: string;

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

  @belongsTo(() => Patient, {
    localKey: 'id',
    foreignKey: 'patient_id',
  })
  public tutor: BelongsTo<typeof Patient>;

  @column({
    columnName: 'client_origin_id',
    serializeAs: null,
  })
  public client_origin_id: string;

  @belongsTo(() => ClientOrigin, {
    localKey: 'id',
    foreignKey: 'client_origin_id',
  })
  public clientOrigin: BelongsTo<typeof ClientOrigin>;
}
