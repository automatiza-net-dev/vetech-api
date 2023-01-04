import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'unavailable_days';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.date('start_date').nullable().alter();
      table.date('end_date').nullable().alter();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.date('start_date').notNullable().alter();
      table.date('end_date').notNullable().alter();
    });
  }
}
