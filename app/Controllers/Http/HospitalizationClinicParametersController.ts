import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import HospitalizationClinicParameterService from 'App/Services/HospitalizationClinicParameterService';
import SharedService from 'App/Services/SharedService';
import CreateHospitalizationClinicParameterValidator from 'App/Validators/HospitalizationClinicParameter/CreateHospitalizationClinicParameterValidator';
import UpdateHospitalizationClinicParameterValidator from 'App/Validators/HospitalizationClinicParameter/UpdateHospitalizationClinicParameterValidator';

@inject()
export default class HospitalizationClinicParametersController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: HospitalizationClinicParameterService,
  ) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateHospitalizationClinicParameterValidator,
    );
    const { user, unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, user, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      UpdateHospitalizationClinicParameterValidator,
    );

    const { unit_id } = this.sharedService.extractUser(auth);
    const result = await this.service.update(unit_id, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
