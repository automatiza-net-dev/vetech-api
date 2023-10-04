import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'budgets';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('reviewer_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('reviewer_id');
    });
  }
}
