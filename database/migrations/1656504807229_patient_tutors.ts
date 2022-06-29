import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patient_tutors';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('patient_id').references('patients.id');

      table.string('document');
      table.string('inscription'); // ie/rg
      table.string('corporate_name').nullable();
      table.string('email');
      table.string('cellphone');
      table.string('telephone').nullable();
      table.string('message_person_name').nullable();
      table.string('message_person_phone').nullable();
      table.string('postal_code', 255);
      table.string('address', 255);
      table.string('number', 255);
      table.string('complement', 255).nullable();
      table.string('district', 255);
      table.string('city', 255);
      table.string('state', 255);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
