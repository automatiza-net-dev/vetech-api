import { DateTime } from "luxon";
import { BaseModel, beforeFetch, beforeFind, column } from "@ioc:Adonis/Lucid/Orm";
import { softDelete, softDeleteQuery } from "App/Services/SoftDelete";

export default class WhatsappClientOrigin extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    columnName: "platform_integration",
    serializeAs: "platformIntegration",
  })
  public platformIntegration: string;

  @column({
    columnName: "description_origin",
    serializeAs: "descriptionOrigin",
  })
  public descriptionOrigin: string;

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
  public client_origin_id: string;
}
