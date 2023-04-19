import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patients';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('hypertension').defaultTo(false);
      table.boolean('diabetes').defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('hypertension');
      table.dropColumn('diabetes');
    });
  }
}
