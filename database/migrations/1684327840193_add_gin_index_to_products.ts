import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  public async up() {
    this.schema.raw('create extension if not exists unaccent;');
  }

  public async down() {
    this.schema.raw('create extension if not exists unaccent;');
  }
}
