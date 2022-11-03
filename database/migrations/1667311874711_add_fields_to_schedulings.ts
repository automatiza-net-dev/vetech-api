import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedules';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('schedule_origin_id').references('schedules.id');
      table.uuid('schedule_return_id').references('schedules.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('schedule_origin_id');
      table.dropColumn('schedule_return_id');
    });
  }
}
