import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import PatientAnimalHair from 'App/Models/PatientAnimalHair';

export default class extends BaseSeeder {
  BASE = [
    {
      description: 'Abricot',
    },
    {
      description: 'Amarelo',
    },
    {
      description: 'Arlequim',
    },
    {
      description: 'Azul',
    },
    {
      description: 'Azul Ruão',
    },
    {
      description: 'Bege',
    },
    {
      description: 'Black And Tan',
    },
    {
      description: 'Boston',
    },
    {
      description: 'Branca',
    },
    {
      description: 'Branco e Bege',
    },
    {
      description: 'Branco e Cinza',
    },
    {
      description: 'Branco e Marrom',
    },
    {
      description: 'Branco e Preto',
    },
    {
      description: 'Branco e Vermelho',
    },
    {
      description: 'Bronze',
    },
    {
      description: 'Caracteristica',
    },
    {
      description: 'Caramelo',
    },
    {
      description: 'Carvao',
    },
    {
      description: 'Champanhe',
    },
    {
      description: 'Cinza',
    },
    {
      description: 'Dourado',
    },
    {
      description: 'Fulvo',
    },
    {
      description: 'Indefinida',
    },
    {
      description: 'Manto Negro',
    },
    {
      description: 'Marrom',
    },
    {
      description: 'Marta e Branco',
    },
    {
      description: 'Pelo Duro (Arame)',
    },
    {
      description: 'Pintado',
    },
    {
      description: 'Preta',
    },
    {
      description: 'Preto e Amarelo',
    },
    {
      description: 'Preto e Branco',
    },
    {
      description: 'Preto e Marrom',
    },
    {
      description: 'Preto e Vermelho',
    },
    {
      description: 'Preto,branco e Marrom',
    },
    {
      description: 'Red Merle',
    },
    {
      description: 'Sal e Pimenta',
    },
    {
      description: 'Tigrado',
    },
    {
      description: 'Tricolor',
    },
    {
      description: 'Vermelho',
    },
    {
      description: 'Vermelho e Branco',
    },
  ];

  public async run() {
    await PatientAnimalHair.fetchOrCreateMany(
      'description',
      this.BASE.map(elem => ({
        description: elem.description,
      })),
    );
  }
}
