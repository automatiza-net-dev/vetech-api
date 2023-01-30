import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'confirmation_tokens';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.string('name');
      table.string('phone');
      table.string('email');
      table.string('code');
      table.dateTime('expires_at');
      table.dateTime('confirmed_at');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
