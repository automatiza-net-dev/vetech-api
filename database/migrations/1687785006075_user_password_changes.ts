import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'user_password_changes';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('system_id')
        .unsigned()
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');
      table
        .uuid('economic_group_id')
        .unsigned()
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');
      table
        .uuid('business_unit_id')
        .unsigned()
        .references('id')
        .inTable('business_units')
        .onDelete('CASCADE');
      table
        .uuid('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.timestamp('expires_at', { useTz: true });
      table.text('hash').notNullable();
      table.boolean('completed').defaultTo(false);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
