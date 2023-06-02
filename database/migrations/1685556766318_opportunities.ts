import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunities';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('system_id')
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');
      table
        .uuid('economic_group_id')
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');
      table
        .uuid('opening_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('closing_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('client_id')
        .references('id')
        .inTable('patients')
        .onDelete('CASCADE');
      table
        .uuid('client_origin_id')
        .references('id')
        .inTable('client_origins')
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

      table.dateTime('opening_date');
      table.dateTime('closing_date');
      table.dateTime('contact_date');
      table.text('description');
      table.text('observation');
      table.float('value');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
