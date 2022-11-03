import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_tutors';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('client_origin_id').references('client_origins.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('client_origin_id');
    });
  }
}
