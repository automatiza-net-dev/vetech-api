// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import SpecieService from 'App/Services/SpecieService';

@inject()
export default class SpeciesController {
  constructor(private readonly service: SpecieService) {}
}
