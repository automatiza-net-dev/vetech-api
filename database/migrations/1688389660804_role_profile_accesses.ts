import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'role_profile_accesses';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('role_id')
        .unsigned()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE');
      table
        .integer('profile_access_id')
        .unsigned()
        .references('id')
        .inTable('profile_accesses')
        .onDelete('CASCADE');

      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
