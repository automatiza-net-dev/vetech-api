import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'bill_payment_conferences';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.setNullable('conference_date');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropNullable('conference_date');
    });
  }
}
