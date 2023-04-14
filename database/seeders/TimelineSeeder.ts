import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TimelineType, {
  ATTENDANCE_UUID,
  DOCUMENT_UUID,
  EVALUATION_UUID,
  EXAM_UUID,
  GLYCEMIA_UUID,
  HOSPITALIZATION_UUID,
  OBSERVATION_UUID,
  PATHOLOGY_UUID,
  PHOTO_UUID,
  PRESSURE_MEASUREMENT_UUID,
  RECIPE_UUID,
  VACCINE_UUID,
  WEIGHT_UUID,
} from 'App/Models/TimelineType';

export default class extends BaseSeeder {
  private BASE: Array<Partial<TimelineType>> = [
    {
      id: PATHOLOGY_UUID,
      description: 'Patologia',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: DOCUMENT_UUID,
      description: 'Documento',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: RECIPE_UUID,
      description: 'Formato Receita Médica',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: WEIGHT_UUID,
      description: 'Peso',
      color: '#000',
      requiresObservation: true,
    },
    {
      id: OBSERVATION_UUID,
      description: 'Observação',
      color: '#000',
      requiresObservation: true,
    },
    {
      id: PHOTO_UUID,
      description: 'Fotos',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: VACCINE_UUID,
      description: 'Vacinas',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: EXAM_UUID,
      description: 'Exames',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: HOSPITALIZATION_UUID,
      description: 'Hospitalização',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: ATTENDANCE_UUID,
      description: 'Consulta',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: EVALUATION_UUID,
      description: 'Avaliação',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: PRESSURE_MEASUREMENT_UUID,
      description: 'Aferição de Pressão',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: GLYCEMIA_UUID,
      description: 'Glicemia',
      color: '#000',
      requiresObservation: false,
    },
  ];

  public async run() {
    await TimelineType.fetchOrCreateMany('id', this.BASE);
  }
}
