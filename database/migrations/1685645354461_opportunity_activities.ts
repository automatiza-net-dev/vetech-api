import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunity_activities';

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
        .uuid('opening_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('execution_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.dateTime('issue_date');
      table.dateTime('executed_date');
      table.dateTime('execution_date');
      table.integer('duration');
      table.text('description');
      table.text('observation');
      table.string('status');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
