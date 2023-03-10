import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientService from 'App/Services/PatientService';
import SharedService from 'App/Services/SharedService';
import CreatePatientSupplierValidator from 'App/Validators/Patient/CreatePatientSupplierValidator';
import UpdatePatientSupplierValidator from 'App/Validators/Patient/UpdatePatientSupplierValidator';

@inject()
export default class PatientSuppliersController {
  constructor(
    private readonly service: PatientService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const qs = request.qs();
    const patients = await this.service.supplierIndex(unit_id, {
      name: qs.name,
      document: qs.document,
    });

    return response.ok(patients);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const patients = await this.service.show(unit_id, params.id);

    return response.ok(patients);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientSupplierValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const supplier = await this.service.storeSupplier(unit_id, payload);

    return response.created(supplier);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdatePatientSupplierValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const supplier = await this.service.updateSupplier(
      unit_id,
      params.id,
      payload,
    );

    return response.ok(supplier);
  }
}
