import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'budgets';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('attendance_id')
        .unsigned()
        .references('id')
        .inTable('attendances')
        .onDelete('CASCADE');
      table.dropColumn('evaluation_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('attendance_id');
    });
  }
}
