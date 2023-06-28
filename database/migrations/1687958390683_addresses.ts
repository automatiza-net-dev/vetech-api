import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'addresses';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .uuid('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.boolean('main').defaultTo(false);
      table.string('postal_code', 255).nullable();
      table.string('address', 255).nullable();
      table.string('number', 255).nullable();
      table.string('complement', 255).nullable();
      table.string('district', 255).nullable();
      table.string('city', 255).nullable();
      table.string('state', 255).nullable();
      table.integer('code').nullable();
      table.string('type').nullable();

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
