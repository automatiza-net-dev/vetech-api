import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedule_service_types';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.boolean('allow_return').defaultTo(false);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('allow_return');
    });
  }
}
