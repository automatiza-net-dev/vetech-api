import { inject } from "@adonisjs/fold";
import Drive from "@ioc:Adonis/Core/Drive";
import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Database from "@ioc:Adonis/Lucid/Database";
import { AuthContext } from "./SharedService";
import { v4 } from "uuid";

@inject()
export default class SystemUrlService {
	public async getSystemUrl(data: { url: string }) {
		return Database.from("systems")
			.select(
				Database.raw(
					"systems.id, systems.name, systems.type, systems.colors, system_urls.url, system_urls.primary_color, system_urls.secondary_color, system_urls.home_image_url, system_urls.logo_url",
				),
			)
			.joinRaw("join system_urls on systems.id = system_urls.system_id")
			.whereRaw("systems.active is true")
			.whereRaw("system_urls.active is true")
			.whereRaw("system_urls.url = ?", [data.url])
			.firstOrFail();
	}

	public async uploadImages(
		authCtx: AuthContext,
		data: {
			home?: MultipartFileContract;
			logo?: MultipartFileContract;
		},
	) {
		await Database.transaction(async (trx) => {
			if (data.home) {
				const homeFileName = `home-${v4()}.${data.home.extname}`;
				await data.home.moveToDisk(
					"systems",
					{
						name: homeFileName,
						visibility: "public",
					},
					"s3-cdn",
				);
				await authCtx.systemUrl
					.merge({
						homeImageUrl: `https://automatiza-cdn.s3.sa-east-1.amazonaws.com/systems/${homeFileName}`,
					})
					.useTransaction(trx)
					.save();
			}

			if (data.logo) {
				const logoFileName = `logo-${v4()}.${data.logo.extname}`;
				await data.logo.moveToDisk(
					"systems",
					{
						name: logoFileName,
						visibility: "public",
					},
					"s3-cdn",
				);
				await authCtx.systemUrl
					.merge({
						logoUrl: `https://automatiza-cdn.s3.sa-east-1.amazonaws.com/systems/${logoFileName}`,
					})
					.useTransaction(trx)
					.save();
			}
		});
	}
}
