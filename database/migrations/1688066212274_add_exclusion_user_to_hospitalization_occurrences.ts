import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_occurrences';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('exclusion_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('exclusion_user_id');
    });
  }
}
