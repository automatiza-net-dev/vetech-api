import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class BillPaymentConference extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({
    columnName: 'issue_date',
  })
  public issueDate: DateTime;

  @column.dateTime({
    columnName: 'conference_date',
  })
  public conferenceDate: DateTime;

  @column({
    serializeAs: null,
  })
  public bill_payment_id: string;

  @column({
    serializeAs: null,
  })
  public issue_user_id: string;

  @column({
    serializeAs: null,
  })
  public conference_user_id: string;
}
