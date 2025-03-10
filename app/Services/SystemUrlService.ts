import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";

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
}
