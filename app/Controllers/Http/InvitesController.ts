// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import InvoiceService from 'App/Services/InvoiceService';

@inject()
export default class InvitesController {
  constructor(private readonly service: InvoiceService) {}
}
