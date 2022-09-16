import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'clinic_parameters';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('economic_group_id')
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('economic_group_id');
    });
  }
}
