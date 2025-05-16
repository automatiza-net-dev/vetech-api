import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import CreateLinkValidator from "App/Validators/S3/CreateLinkValidator";
import { DateTime } from "luxon";
import SharedService from "App/Services/SharedService";
import CreateLinksValidator from "App/Validators/S3/CreateLinksValidator";

@inject()
export default class S3sController {
	constructor(private sharedService: SharedService) {}

	public async createLink({ request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const data = await request.validate(CreateLinkValidator);

			const linkMap = await SharedService.ComputePublicS3Link([data.key]);

			return response.ok({
				link: linkMap[data.key] ?? null,
				expiration: DateTime.now().plus({ hours: 1 }),
			});
		});
	}

	public async createLinks({ request, response }: HttpContextContract) {
		return this.sharedService.errorHoc(response, async () => {
			const data = await request.validate(CreateLinksValidator);

			const linkMap = await SharedService.ComputePublicS3Link(data.keys);

			return response.ok(linkMap);
		});
	}
}
