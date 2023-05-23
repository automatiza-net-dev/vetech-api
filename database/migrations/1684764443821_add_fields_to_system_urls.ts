import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'system_urls';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('primary_color');
      table.string('secondary_color');
      table.string('home_image_url');
      table.string('logo_url');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('primary_color');
      table.dropColumn('secondary_color');
      table.dropColumn('home_image_url');
      table.dropColumn('logo_url');
    });
  }
}
