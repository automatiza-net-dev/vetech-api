import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'crm_statuses';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('system_id')
        .unsigned()
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');
      table
        .uuid('economic_group_id')
        .unsigned()
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('system_id');
      table.dropColumn('economic_group_id');
    });
  }
}
