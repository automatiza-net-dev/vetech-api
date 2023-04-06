import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'exams';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('product_id')
        .references('id')
        .inTable('products')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('product_id');
    });
  }
}
