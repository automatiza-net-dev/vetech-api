import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'reschedulings';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('update_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('update_user_id');
    });
  }
}
