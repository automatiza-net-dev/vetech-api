import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunities';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('schedule_id')
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('schedule_id');
    });
  }
}
