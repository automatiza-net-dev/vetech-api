import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'medical_prescriptions';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary(); // i

      table.uuid('prescription_unit_id').references('units.id'); // xvii
      table.uuid('fluid_unit_id').references('units.id'); // xvii
      table.uuid('business_unit_id').references('business_units.id');
      table
        .uuid('drug_administration_id')
        .references('drug_administrations.id'); // xiv

      table.string('name'); // ii
      table.string('type'); // iii
      table.dateTime('prescribed_at'); // iv
      table.string('frequency'); // v
      table.integer('frequency_interval'); // vi
      table.string('frequency_unit'); // vii
      table.integer('frequency_quantity'); // viii
      table.string('frequency_quantity_unit'); // ix
      table.text('description'); // x
      table.text('resume'); // xi
      table.float('dose'); // xiii
      table.string('fluid_set'); // xv
      table.float('fluid_speed'); // xvi
      table.text('suplement'); // xvviii
      table.boolean('active').defaultTo(true); // xix

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
