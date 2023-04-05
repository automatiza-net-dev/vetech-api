import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'vaccine_calendars';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.dateTime('scheduling_date').alter();
      table.dateTime('application_date').nullable().alter();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.date('scheduling_date').alter();
      table.date('application_date').nullable().alter();
    });
  }
}
