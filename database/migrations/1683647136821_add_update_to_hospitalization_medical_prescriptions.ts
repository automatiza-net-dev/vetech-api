import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'hospitalization_medical_prescriptions';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('update_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.string('status');
      table.dateTime('excluded_at');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('update_user_id');
      table.dropColumn('status');
      table.dropColumn('excluded_at');
    });
  }
}
