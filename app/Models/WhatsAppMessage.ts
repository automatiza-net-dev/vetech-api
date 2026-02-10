import { DateTime } from "luxon";
import { BaseModel, column, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";
import WhatsAppMessagesConfig from "./WhatsAppMessagesConfig";

export default class WhatsappMessage extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({})
  public phone: string;

  @column({})
  public message: string;

  @column({
    columnName: "platform_integration",
    serializeAs: "platformIntegration",
  })
  public platformIntegration: string;

  @column({})
  public payload: unknown;

  @column.dateTime({ autoCreate: true })
  public eventCreated: DateTime;

  @column.dateTime({ autoCreate: true })
  public lastEventInteraction: DateTime;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column()
  public processed: boolean;

  @column({
    columnName: "processed_message",
    serializeAs: "processedMessage",
  })
  public processedMessage: string;

  @column({
    serializeAs: null,
  })
  public whatsapp_messages_config_id: number;

  @belongsTo(() => WhatsAppMessagesConfig, {
    foreignKey: "whatsapp_messages_config_id",
  })
  public config: BelongsTo<typeof WhatsAppMessagesConfig>;
}
