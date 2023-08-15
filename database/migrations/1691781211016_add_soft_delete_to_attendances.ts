import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'attendances';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('exclusion_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('exclusion_user_id');
      table.dropColumn('deleted_at');
    });
  }
}
