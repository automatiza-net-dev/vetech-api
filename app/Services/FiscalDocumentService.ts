import { inject } from "@adonisjs/fold";
import FiscalDocument from "App/Models/FiscalDocument";

@inject()
export default class FiscalDocumentService {
  async index() {
    return FiscalDocument.query().where('active', true)
  }
}
