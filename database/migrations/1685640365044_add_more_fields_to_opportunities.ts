import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunities';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('reason_id')
        .references('id')
        .inTable('reasons')
        .onDelete('CASCADE');

      table.float('profit_value');
      table.text('result_observation');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('reason_id');

      table.dropColumn('profit_value');
      table.dropColumn('result_observation');
    });
  }
}
