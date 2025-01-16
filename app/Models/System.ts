import Env from "@ioc:Adonis/Core/Env";
import { BaseModel, HasMany, column, hasMany } from "@ioc:Adonis/Lucid/Orm";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import { axiom } from "App/Lib/Axiom";
import SystemUrl from "App/Models/SystemUrl";
import { DateTime } from "luxon";
import { ConfigSchema, TConfigSchema } from "./BusinessUnitConfig";

export default class System extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public name: string;

	@column()
	public active: boolean;

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

	@column({})
	public type: string;

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

				console.error(result.error.flatten());

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

	@hasMany(() => SystemUrl, {
		foreignKey: "system_id",
	})
	public systemUrls: HasMany<typeof SystemUrl>;

	@column({ serializeAs: null })
	public default_role_id: number;
}
