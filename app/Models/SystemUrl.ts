import { BaseModel, BelongsTo, belongsTo, column } from "@ioc:Adonis/Lucid/Orm";
import Env from "@ioc:Adonis/Core/Env";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import { axiom } from "App/Lib/Axiom";
import System from "App/Models/System";
import { DateTime } from "luxon";
import { ConfigSchema, TConfigSchema } from "./BusinessUnitConfig";

export default class SystemUrl extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public url: string;

	@column()
	public name: string;

	@column({
		columnName: "colors",
		consume: (rawVal: string) => {
			return rawVal.split(",");
		},
		prepare: (value: string[]) => {
			return value.join(",");
		},
	})
	public colors: string[];

	@column({
		columnName: "mail_image",
		serializeAs: "mailImage",
	})
	public mailImage: string | null;

	@column({
		columnName: "mail_background_color",
		serializeAs: "mailBackgroundColor",
	})
	public mailBackgroundColor: string | null;

	@column({
		columnName: "mail_text_new_user",
		serializeAs: "mailTextNewUser",
	})
	public mailTextNewUser: string | null;

	@column({
		columnName: "mail_text_warn_user",
		serializeAs: "mailTextWarnUser",
	})
	public mailTextWarnUser: string | null;

	@column({
		columnName: "primary_color",
	})
	public primaryColor: string;

	@column({
		columnName: "secondary_color",
	})
	public secondaryColor: string;

	@column({
		columnName: "home_image_url",
	})
	public homeImageUrl: string;

	@column({
		columnName: "logo_url",
	})
	public logoUrl: string;

	@column()
	public active: boolean;

	@column({
		columnName: "default_config",
		serializeAs: null,
		consume(rawValue) {
			const result = ConfigSchema.safeParse(rawValue);
			if (!result.success) {
				axiom.ingest(Env.get("AXIOM_DATASET"), [
					{
						_type: "$config-error",
						origin: "system",
						errors: result.error.flatten(),
					},
				]);
				axiom.flush().catch((err) => {
					console.error(err);
				});

				console.error({
					err: result.error,
					flat: result.error.flatten(),
				});

				throw new InternalErrorException(
					"Erro buscando informações da unidade, contate o desenvolvedor",
					500,
					"E_ERR",
				);
			}

			return result.data;
		},
		serialize(zodValue: TConfigSchema) {
			return JSON.stringify(zodValue);
		},
	})
	public defaultConfig: TConfigSchema;

	@column.dateTime({ autoCreate: true })
	public createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	public updatedAt: DateTime;

	@column({
		serializeAs: null,
	})
	public system_id: number;

	@belongsTo(() => System, {
		foreignKey: "system_id",
	})
	public system: BelongsTo<typeof System>;
}
