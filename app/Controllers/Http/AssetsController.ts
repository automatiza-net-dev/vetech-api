import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import CreateLinkValidator from "App/Validators/S3/CreateLinkValidator";
import Application from "@ioc:Adonis/Core/Application";

@inject()
export default class AssetsController {
	public async download({ request, response }: HttpContextContract) {
		const data = await request.validate(CreateLinkValidator);

		const filePath = Application.tmpPath(data.key);

		console.log({ filePath });

		return response.download(filePath);
	}
}
