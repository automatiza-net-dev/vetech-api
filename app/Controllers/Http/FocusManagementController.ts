import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { inject } from "@adonisjs/fold";
import SharedService from "App/Services/SharedService";
import FocusNfeBusinessManagementService from "App/Services/FocusNfeBusinessManagementService";
import CreateBusinessValidator from "App/Validators/FocusManagement/CreateBusinessValidator";
import CreateBusiness_0Validator from "App/Validators/FocusManagement/CreateBusiness_0Validator";
import CreateBusiness_65Validator from "App/Validators/FocusManagement/CreateBusiness_65Validator";
import CreateBusiness_55_65Validator from "App/Validators/FocusManagement/CreateBusiness_55_65Validator";
import CreateBusiness_55Validator from "App/Validators/FocusManagement/CreateBusiness_55Validator";

@inject()
export default class FocusManagementController {
  constructor(
    private sharedService: SharedService,
    private service: FocusNfeBusinessManagementService,
  ) {}

  public async createBusiness({ request, response, auth }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    const fixedPayload = await request.validate(CreateBusinessValidator);
    let dynamicPayload: Record<string, string | number> = {};

    if (fixedPayload.models.includes(0)) {
      dynamicPayload = Object.assign(
        dynamicPayload,
        await request.validate(CreateBusiness_0Validator),
      );
    }

    if (fixedPayload.models.includes(65)) {
      dynamicPayload = Object.assign(
        dynamicPayload,
        await request.validate(CreateBusiness_65Validator),
      );
      dynamicPayload = Object.assign(
        dynamicPayload,
        await request.validate(CreateBusiness_55_65Validator),
      );
    }

    if (fixedPayload.models.includes(55)) {
      dynamicPayload = Object.assign(
        dynamicPayload,
        await request.validate(CreateBusiness_55Validator),
      );
      dynamicPayload = Object.assign(
        dynamicPayload,
        await request.validate(CreateBusiness_55_65Validator),
      );
    }

    const result = await this.service.createBusiness(authCtx, fixedPayload, dynamicPayload);

    return response.ok(result);
  }
}
