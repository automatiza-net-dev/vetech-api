import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class UsersSchema extends BaseSchema {
  protected tableName = 'users';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();
      table.string('email', 255).notNullable();
      table.string('password', 180).notNullable();
      table.string('document', 20).notNullable();
      table.string('phone', 20).nullable();
      table.string('profile_picture', 255).nullable();
      table.string('postal_code', 255).nullable();
      table.string('address', 255).nullable();
      table.string('number', 255).nullable();
      table.string('complement', 255).nullable();
      table.string('district', 255).nullable();
      table.string('city', 255).nullable();
      table.string('state', 255).nullable();
      table.string('remember_me_token').nullable();

      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable();
      table.timestamp('updated_at', { useTz: true }).notNullable();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
