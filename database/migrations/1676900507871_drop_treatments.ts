import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'treatments';

  public async up() {
    this.schema.dropTable(this.tableName);
  }

  public async down() {
    console.log('no down');
  }
}
