import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_animals';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('castrated');
      table.dropColumn('registered');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('castrated');
      table.boolean('registered');
    });
  }
}
