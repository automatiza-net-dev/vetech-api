import BaseSchema from '@ioc:Adonis/Lucid/Schema';
import { VaccineType } from 'App/Models/Vaccine';

export default class extends BaseSchema {
  protected tableName = 'vaccines';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('type').defaultTo(VaccineType.VACCINE);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('type');
    });
  }
}
