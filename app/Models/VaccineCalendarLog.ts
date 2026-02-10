import { DateTime } from "luxon";
import { BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class VaccineCalendarLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({})
  public applicationDate: DateTime;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column({
    serializeAs: null,
  })
  vaccine_calendar_id: string;

  @column({
    serializeAs: null,
  })
  application_user_id: string;

  @column({
    serializeAs: null,
  })
  exclusion_user_id: string;
}
