import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedules';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('reason_id')
        .references('id')
        .inTable('reasons')
        .onDelete('CASCADE');

      table.text('observation').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('reason_id');
      table.dropColumn('observation');
    });
  }
}
