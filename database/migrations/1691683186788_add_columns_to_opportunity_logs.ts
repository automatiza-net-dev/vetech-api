import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunity_logs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('closing_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('client_id')
        .references('id')
        .inTable('patients')
        .onDelete('CASCADE');
      table
        .integer('contact_type_id')
        .unsigned()
        .references('id')
        .inTable('contact_types')
        .onDelete('CASCADE');
      table
        .integer('contact_subject_id')
        .unsigned()
        .references('id')
        .inTable('contact_subjects')
        .onDelete('CASCADE');
      table
        .uuid('reason_id')
        .references('id')
        .inTable('reasons')
        .onDelete('CASCADE');

      table.dateTime('contact_date');
      table.dateTime('closing_date');
      table.text('description');
      table.text('observation');
      table.float('profit_value');
      table.float('balance');
      table.text('result_observation');
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
