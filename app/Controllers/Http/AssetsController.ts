import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import CreateLinkValidator from "App/Validators/S3/CreateLinkValidator";
import Application from "@ioc:Adonis/Core/Application";
import Drive from "@ioc:Adonis/Core/Drive";
import Env from "@ioc:Adonis/Core/Env";

@inject()
export default class AssetsController {
	public async download({ request, response }: HttpContextContract) {
		const data = await request.validate(CreateLinkValidator);

		const localFilePath = await Drive.use("local").getUrl(data.key);
		const fullPath = `${Env.get(
			"LOCAL_DISK_ROOT",
			Application.tmpPath(),
		)}${localFilePath}`.replace("/uploads", "");

		return response.download(fullPath);
	}
}
