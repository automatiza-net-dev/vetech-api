import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bills';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('financial_responsible_id')
        .nullable()
        .references('id')
        .inTable('patients')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('financial_responsible_id');
    });
  }
}
