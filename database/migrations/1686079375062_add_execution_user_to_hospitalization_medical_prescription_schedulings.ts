import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_medical_prescription_schedulings';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('execution_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('execution_user_id');
    });
  }
}
