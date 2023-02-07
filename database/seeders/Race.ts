import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Race from 'App/Models/Race';
import Specie from 'App/Models/Specie';
import { v4 } from 'uuid';

export default class extends BaseSeeder {
  BASE = [
    {
      specie: 'Canina',
      race: 'Affenpinscher',
    },
    {
      specie: 'Canina',
      race: 'Afghanhound',
    },
    {
      specie: 'Canina',
      race: 'Airedale Terrier',
    },
    {
      specie: 'Canina',
      race: 'Akita',
    },
    {
      specie: 'Canina',
      race: 'American Bully',
    },
    {
      specie: 'Canina',
      race: 'American staffordshire terrier',
    },
    {
      specie: 'Canina',
      race: 'Angora',
    },
    {
      specie: 'Canina',
      race: 'Basenji',
    },
    {
      specie: 'Canina',
      race: 'Bassethound',
    },
    {
      specie: 'Canina',
      race: 'Beagle',
    },
    {
      specie: 'Canina',
      race: 'Bearded Collie',
    },
    {
      specie: 'Canina',
      race: 'Beauceron',
    },
    {
      specie: 'Canina',
      race: 'Bedlington',
    },
    {
      specie: 'Canina',
      race: 'Bergamasco',
    },
    {
      specie: 'Canina',
      race: 'Bernese',
    },
    {
      specie: 'Canina',
      race: 'Bichon Frise',
    },
    {
      specie: 'Canina',
      race: 'Biewer Terrier',
    },
    {
      specie: 'Canina',
      race: 'Bloodhound',
    },
    {
      specie: 'Canina',
      race: 'Blue Heeler',
    },
    {
      specie: 'Canina',
      race: 'Border Collie',
    },
    {
      specie: 'Canina',
      race: 'Border Terrier',
    },
    {
      specie: 'Canina',
      race: 'Borzoi',
    },
    {
      specie: 'Canina',
      race: 'Boston Terrier',
    },
    {
      specie: 'Canina',
      race: 'Bouvier de Flandres',
    },
    {
      specie: 'Canina',
      race: 'Boxer',
    },
    {
      specie: 'Canina',
      race: 'Braco Frances',
    },
    {
      specie: 'Canina',
      race: 'Braco Italiano',
    },
    {
      specie: 'Canina',
      race: 'Bretão',
    },
    {
      specie: 'Canina',
      race: 'Briard',
    },
    {
      specie: 'Canina',
      race: 'Buldogue Campeiro',
    },
    {
      specie: 'Canina',
      race: 'Buldogue Frances',
    },
    {
      specie: 'Canina',
      race: 'Buldogue Ingles',
    },
    {
      specie: 'Canina',
      race: 'Bullmastiff',
    },
    {
      specie: 'Canina',
      race: 'Bullterrier',
    },
    {
      specie: 'Canina',
      race: 'Cairn Terrier',
    },
    {
      specie: 'Canina',
      race: 'Cane corso',
    },
    {
      specie: 'Canina',
      race: 'Cavalier King Charles Spaniel',
    },
    {
      specie: 'Canina',
      race: 'Chesapeake',
    },
    {
      specie: 'Canina',
      race: 'Chihuahua',
    },
    {
      specie: 'Canina',
      race: 'Chinese Crested Dog',
    },
    {
      specie: 'Canina',
      race: 'Chow Chow',
    },
    {
      specie: 'Canina',
      race: 'Clumber Spaniel',
    },
    {
      specie: 'Canina',
      race: 'Cocker Spaniel Americano',
    },
    {
      specie: 'Canina',
      race: 'Cocker Spaniel Ingles',
    },
    {
      specie: 'Canina',
      race: 'Collie',
    },
    {
      specie: 'Canina',
      race: 'Coonhound',
    },
    {
      specie: 'Canina',
      race: 'Dachshund',
    },
    {
      specie: 'Canina',
      race: 'Dalmata',
    },
    {
      specie: 'Canina',
      race: 'Deerhound',
    },
    {
      specie: 'Canina',
      race: 'Dobermann',
    },
    {
      specie: 'Canina',
      race: 'Dogo Argentino',
    },
    {
      specie: 'Canina',
      race: 'Dogue Alemão',
    },
    {
      specie: 'Canina',
      race: 'Elkhound Noruegues',
    },
    {
      specie: 'Canina',
      race: 'Fila Brasileiro',
    },
    {
      specie: 'Canina',
      race: 'Flat Coated Retriever',
    },
    {
      specie: 'Canina',
      race: 'Fox Terrier',
    },
    {
      specie: 'Canina',
      race: 'Fox Terrier Brasileiro',
    },
    {
      specie: 'Canina',
      race: 'Foxhound Americano',
    },
    {
      specie: 'Canina',
      race: 'Foxhound Ingles',
    },
    {
      specie: 'Canina',
      race: 'Galgo Afegão',
    },
    {
      specie: 'Canina',
      race: 'Galgo inglês',
    },
    {
      specie: 'Canina',
      race: 'Galgo Italiano',
    },
    {
      specie: 'Canina',
      race: 'Golden Retriever',
    },
    {
      specie: 'Canina',
      race: 'Greyhound',
    },
    {
      specie: 'Canina',
      race: 'Hamster',
    },
    {
      specie: 'Canina',
      race: 'Husky Siberiano',
    },
    {
      specie: 'Canina',
      race: 'Irish Terrier',
    },
    {
      specie: 'Canina',
      race: 'Jack Russell Terrier',
    },
    {
      specie: 'Canina',
      race: 'Jagdterrier',
    },
    {
      specie: 'Canina',
      race: 'Keeshond',
    },
    {
      specie: 'Canina',
      race: 'Komondor',
    },
    {
      specie: 'Canina',
      race: 'Labrador',
    },
    {
      specie: 'Canina',
      race: 'Lapão',
    },
    {
      specie: 'Canina',
      race: 'Leonberger',
    },
    {
      specie: 'Canina',
      race: 'Lhasa Apso',
    },
    {
      specie: 'Canina',
      race: 'Lulu da Pomerânia',
    },
    {
      specie: 'Canina',
      race: 'Maine Coon',
    },
    {
      specie: 'Canina',
      race: 'Malamute dos Alasca',
    },
    {
      specie: 'Canina',
      race: 'Maltês',
    },
    {
      specie: 'Canina',
      race: 'Maltês Poodle',
    },
    {
      specie: 'Canina',
      race: 'Mastiff',
    },
    {
      specie: 'Canina',
      race: 'Mastim Bordeaux',
    },
    {
      specie: 'Canina',
      race: 'Mastim dos Pirineus',
    },
    {
      specie: 'Canina',
      race: 'Mastim Napolitano',
    },
    {
      specie: 'Canina',
      race: 'Miniatura Bullterrier',
    },
    {
      specie: 'Canina',
      race: 'Miniatura Dachshund',
    },
    {
      specie: 'Canina',
      race: 'Miniatura Pinscher',
    },
    {
      specie: 'Canina',
      race: 'Norwich Terrier',
    },
    {
      specie: 'Canina',
      race: 'Old English Sheepdog',
    },
    {
      specie: 'Canina',
      race: 'Papillon',
    },
    {
      specie: 'Canina',
      race: 'Pastor Alemão',
    },
    {
      specie: 'Canina',
      race: 'Pastor australiano',
    },
    {
      specie: 'Canina',
      race: 'Pastor Belga',
    },
    {
      specie: 'Canina',
      race: 'Pastor do Cáucaso',
    },
    {
      specie: 'Canina',
      race: 'Pastor Maremano',
    },
    {
      specie: 'Canina',
      race: 'Pastor-Branco-Suiço',
    },
    {
      specie: 'Canina',
      race: 'Pastor-de-shetland',
    },
    {
      specie: 'Canina',
      race: 'Pelo Curto Brasileiro',
    },
    {
      specie: 'Canina',
      race: 'Pequines',
    },
    {
      specie: 'Canina',
      race: 'Persa',
    },
    {
      specie: 'Canina',
      race: 'Pinscher',
    },
    {
      specie: 'Canina',
      race: 'Pit Bull',
    },
    {
      specie: 'Canina',
      race: 'Pointer Alemão',
    },
    {
      specie: 'Canina',
      race: 'Pointer Ingles',
    },
    {
      specie: 'Canina',
      race: 'Pomsky',
    },
    {
      specie: 'Canina',
      race: 'Poodle Gigante',
    },
    {
      specie: 'Canina',
      race: 'Poodle Micro',
    },
    {
      specie: 'Canina',
      race: 'Poodle Standard',
    },
    {
      specie: 'Canina',
      race: 'Poodle Toy',
    },
    {
      specie: 'Canina',
      race: 'Pug',
    },
    {
      specie: 'Canina',
      race: 'Puli',
    },
    {
      specie: 'Canina',
      race: 'Red Heeler',
    },
    {
      specie: 'Canina',
      race: 'Retriever dos Labrador',
    },
    {
      specie: 'Canina',
      race: 'Rhodesian Ridgeback',
    },
    {
      specie: 'Canina',
      race: 'Rottweiller',
    },
    {
      specie: 'Canina',
      race: 'S. R. D.',
    },
    {
      specie: 'Canina',
      race: 'Sabujo',
    },
    {
      specie: 'Canina',
      race: 'Sagrado da Birmânia',
    },
    {
      specie: 'Canina',
      race: 'Saluki',
    },
    {
      specie: 'Canina',
      race: 'Samoieda',
    },
    {
      specie: 'Canina',
      race: 'São Bernardo',
    },
    {
      specie: 'Canina',
      race: 'Schipperkee',
    },
    {
      specie: 'Canina',
      race: 'Schnauzer',
    },
    {
      specie: 'Canina',
      race: 'Schnauzer Anão',
    },
    {
      specie: 'Canina',
      race: 'Schnauzer Gigante',
    },
    {
      specie: 'Canina',
      race: 'Scotch Terrier',
    },
    {
      specie: 'Canina',
      race: 'Scottish Fold',
    },
    {
      specie: 'Canina',
      race: 'Scottish Terrier',
    },
    {
      specie: 'Canina',
      race: 'Setter Gordon',
    },
    {
      specie: 'Canina',
      race: 'Setter Ingles',
    },
    {
      specie: 'Canina',
      race: 'Setter Irlandes',
    },
    {
      specie: 'Canina',
      race: 'Shar-pei',
    },
    {
      specie: 'Canina',
      race: 'Shiba inu',
    },
    {
      specie: 'Canina',
      race: 'Shih- Tzu',
    },
    {
      specie: 'Canina',
      race: 'Siames',
    },
    {
      specie: 'Canina',
      race: 'Silk Terrier',
    },
    {
      specie: 'Canina',
      race: 'Skye Terrier',
    },
    {
      specie: 'Canina',
      race: 'Slughi',
    },
    {
      specie: 'Canina',
      race: 'Spaniel Bretão',
    },
    {
      specie: 'Canina',
      race: 'Spitz',
    },
    {
      specie: 'Canina',
      race: 'Springer Spaniel',
    },
    {
      specie: 'Canina',
      race: 'Staffordshire Bull Terrier',
    },
    {
      specie: 'Canina',
      race: 'Staffordshire Terrier American',
    },
    {
      specie: 'Canina',
      race: 'Tenerife',
    },
    {
      specie: 'Canina',
      race: 'Terra Nova',
    },
    {
      specie: 'Canina',
      race: 'Vizsla',
    },
    {
      specie: 'Canina',
      race: 'Weimaraner',
    },
    {
      specie: 'Canina',
      race: 'Welsh Corgi',
    },
    {
      specie: 'Canina',
      race: 'West highland white terrier',
    },
    {
      specie: 'Canina',
      race: 'Whippet',
    },
    {
      specie: 'Canina',
      race: 'Wolfhound Irlandes',
    },
    {
      specie: 'Canina',
      race: 'Yorkshire Terrier',
    },
    {
      specie: 'Felina',
      race: 'Angorá',
    },
    {
      specie: 'Felina',
      race: 'Bengal',
    },
    {
      specie: 'Felina',
      race: 'Maine coon',
    },
    {
      specie: 'Felina',
      race: 'Persa',
    },
    {
      specie: 'Felina',
      race: 'Ragdoll',
    },
    {
      specie: 'Felina',
      race: 'Siamês',
    },
    {
      specie: 'Felina',
      race: 'Sphinx',
    },
    {
      specie: 'Felina',
      race: 'Srd',
    },
  ];

  public async run() {
    const species = await Specie.all();

    const data: Array<Partial<Race>> = this.BASE.map(elem => {
      const specie = species.find(s => s.description === elem.specie);
      if (!specie) {
        throw new Error(`Especie ${elem.specie} não encontrado`);
      }

      return {
        id: v4(),
        description: elem.race,
        specie_id: specie.id,
      };
    });

    await Race.fetchOrCreateMany('description', data);
  }
}
