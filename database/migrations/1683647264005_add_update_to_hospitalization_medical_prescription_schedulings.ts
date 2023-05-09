import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_medical_prescription_schedulings';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('update_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.dateTime('excluded_at');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('update_user_id');
      table.dropColumn('excluded_at');
    });
  }
}
