import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";

@inject()
export default class SystemUrlService {
	public async getSystemUrl(data: { url: string }) {
		return Database.from("systems")
			.select(
				Database.raw(
					"systems.id, systems.name, systems.type, systems.colors, su.url, su.primary_color, su.secondary_color, su.home_image_url, su.logo_url",
				),
			)
			.joinRaw("system_urls su on systems.id = su.system_id")
			.whereRaw("systems.active is active")
			.whereRaw("su.active is active")
			.whereRaw("su.url = ?", [data.url])
			.firstOrFail();
	}
}
