import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'third_party_user_permissions';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .uuid('user_id')
        .references('id')
        .inTable('third_party_users')
        .onDelete('CASCADE');
      table
        .integer('system_id')
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');

      table.uuid('key');
      table.string('password');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('disabled_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
