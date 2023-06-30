import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_payment_conferences';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .uuid('bill_payment_id')
        .references('id')
        .inTable('bill_payments')
        .onDelete('CASCADE');
      table
        .uuid('issue_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('conference_user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');

      table.dateTime('issue_date').notNullable();
      table.dateTime('conference_date').notNullable();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
