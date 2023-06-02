import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunity_logs';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('opportunity_id')
        .unsigned()
        .references('id')
        .inTable('opportunities')
        .onDelete('CASCADE');
      table
        .uuid('economic_group_id')
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');
      table
        .uuid('business_unit_id')
        .references('id')
        .inTable('business_units')
        .onDelete('CASCADE');
      table
        .uuid('opening_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('contact_id')
        .unsigned()
        .references('id')
        .inTable('patients')
        .onDelete('CASCADE');
      table
        .integer('status_id')
        .unsigned()
        .references('id')
        .inTable('crm_statuses')
        .onDelete('CASCADE');

      table.dateTime('opening_date');
      table.float('value');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
