import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import CreateLinkValidator from "App/Validators/S3/CreateLinkValidator";
import Drive from "@ioc:Adonis/Core/Drive";
import { DateTime } from "luxon";
import SharedService from "App/Services/SharedService";

@inject()
export default class S3sController {
	constructor(private sharedService: SharedService) {}

	public async createLink({ request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const data = await request.validate(CreateLinkValidator);

			const link = await Drive.use("s3").getSignedUrl(data.key, {
				expiresIn: "1h",
			});

			return response.ok({
				link,
				expiration: DateTime.now().plus({ hours: 1 }),
			});
		});
	}
}
