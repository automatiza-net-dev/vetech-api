import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import CreateLinkValidator from "App/Validators/S3/CreateLinkValidator";
import Drive from "@ioc:Adonis/Core/Drive";
import { DateTime } from "luxon";

@inject()
export default class S3sController {
	public async createLink({ request, response }: HttpContextContract) {
		const data = await request.validate(CreateLinkValidator);

		const link = await Drive.use("s3").getSignedUrl(data.key, {
			expiresIn: "1h",
		});

		return response.ok({
			link,
			expiration: DateTime.now().plus({ hours: 1 }),
		});
	}
}
