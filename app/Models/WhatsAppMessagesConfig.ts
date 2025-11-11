import { DateTime } from "luxon";
import {
	BaseModel,
	column,
	belongsTo,
	BelongsTo,
	hasMany,
	HasMany,
} from "@ioc:Adonis/Lucid/Orm";
import BusinessUnit from "./BusinessUnit";
import User from "./User";
import WhatsAppMessage from "./WhatsAppMessage";

export default class WhatsappMessagesConfig extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column({
		columnName: "whatsapp_phone",
		serializeAs: "whatsappPhone",
	})
	public whatsappPhone: string;

	@column({
		columnName: "platform_integration",
		serializeAs: "platformIntegration",
	})
	public platformIntegration: string;

	@column({
		columnName: "connection_status",
		serializeAs: "connectionStatus",
	})
	public connectionStatus: string;

	@column.dateTime({
		columnName: "connection_status_date",
		serializeAs: "connectionStatusDate",
	})
	public connectionStatusDate: DateTime;

	@column()
	public active: boolean;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column.dateTime({
		columnName: "deleted_at",
		serializeAs: "deletedAt",
	})
	public deletedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public business_unit_id: string;

	@column({
		serializeAs: null,
	})
	public user_id_created: string;

	@column({
		serializeAs: null,
	})
	public user_id_updated: string;

	@belongsTo(() => BusinessUnit, { foreignKey: "business_unit_id" })
	public businessUnit: BelongsTo<typeof BusinessUnit>;

	@belongsTo(() => User, { foreignKey: "user_id_created" })
	public userCreated: BelongsTo<typeof User>;

	@belongsTo(() => User, { foreignKey: "user_id_updated" })
	public userUpdated: BelongsTo<typeof User>;

	@hasMany(() => WhatsAppMessage, { foreignKey: "whatsapp_messages_config_id" })
	public messages: HasMany<typeof WhatsAppMessage>;
}
