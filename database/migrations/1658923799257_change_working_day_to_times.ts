import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'working_days';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.time('start_hour').alter();
      table.time('end_hour').alter();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.timestamp('start_hour').alter();
      table.timestamp('end_hour').alter();
    });
  }
}
