import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'user_unit_roles';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.uuid('user_id').references('users.id');
      table.uuid('unit_id').references('business_units.id');
      table.integer('role_id').unsigned().references('roles.id');

      table.unique(['user_id', 'unit_id', 'role_id']);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
