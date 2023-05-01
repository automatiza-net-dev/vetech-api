import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'api_tokens';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('system_id')
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('system_id');
    });
  }
}
