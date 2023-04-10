import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Pathology from 'App/Models/Pathology';
import TimelineType, { PATHOLOGY_UUID } from 'App/Models/TimelineType';

export default class extends BaseSeeder {
  BASE = [
    {
      description: 'ABSCESSO',
      definition: 'ABSCESSO',
      template: '',
    },
    {
      description: 'ABSCESSO DE GLÂNDULA ADANAL',
      definition: 'ABSCESSO DE GLÂNDULA ADANAL',
      template: '',
    },
    {
      description: 'ALTA NÃO INDICADA',
      definition: 'ALTA NÃO INDICADA',
      template: '',
    },
    {
      description: 'AMPUTAÇÃO',
      definition: 'AMPUTAÇÃO',
      template: '',
    },
    {
      description: 'AMPUTAÇÃO DE RETO',
      definition: 'AMPUTAÇÃO DE RETO',
      template: '',
    },
    {
      description: 'ANOREXIA',
      definition: 'ANOREXIA',
      template: '',
    },
    {
      description: 'APATIA',
      definition: 'APATIA',
      template: '',
    },
    {
      description: 'ARTROPLASTIA EXCISIONAL DE CABEÇA E COLO FEMORAL',
      definition: 'ARTROPLASTIA EXCISIONAL DE CABEÇA E COLO FEMORAL',
      template: '',
    },
    {
      description: 'ATAXIA',
      definition: 'ATAXIA',
      template: '',
    },
    {
      description: 'ATOPIA',
      definition: 'ATOPIA',
      template: '',
    },
    {
      description: 'BIÓPSIA EXCISIONAL',
      definition: 'BIÓPSIA EXCISIONAL',
      template: '',
    },
    {
      description: 'BIÓPSIA HEPÁTICA',
      definition: 'BIÓPSIA HEPÁTICA',
      template: '',
    },
    {
      description: 'BIÓPSIA INCISIONAL',
      definition: 'BIÓPSIA INCISIONAL',
      template: '',
    },
    {
      description: 'BRONQUITE',
      definition: 'BRONQUITE',
      template: '',
    },
    {
      description: 'CÁLCULO VESICAL',
      definition: 'CÁLCULO VESICAL',
      template: '',
    },
    {
      description: 'CARDIOPATIA',
      definition: 'CARDIOPATIA',
      template: '',
    },
    {
      description: 'CAUDECTOMIA TERAPÊUTICA',
      definition: 'CAUDECTOMIA TERAPÊUTICA',
      template: '',
    },
    {
      description: 'CESÁREA + OH',
      definition: 'CESÁREA + OH',
      template: '',
    },
    {
      description: 'CESÁREA CONSERVATIVA',
      definition: 'CESÁREA CONSERVATIVA',
      template: '',
    },
    {
      description: 'CETOACIDOSE DIABÉTICA',
      definition: 'CETOACIDOSE DIABÉTICA',
      template: '',
    },
    {
      description: 'CHECK-UP',
      definition: 'CHECK-UP',
      template: '',
    },
    {
      description: 'CINOMOSE',
      definition: 'CINOMOSE',
      template: '',
    },
    {
      description: 'CISTITE',
      definition: 'CISTITE',
      template: '',
    },
    {
      description: 'CISTOTOMIA',
      definition: 'CISTOTOMIA',
      template: '',
    },
    {
      description: 'CLAUDICAÇÃO',
      definition: 'CLAUDICAÇÃO',
      template: '',
    },
    {
      description: 'COLAPSO DE TRAQUÉIA',
      definition: 'COLAPSO DE TRAQUÉIA',
      template: '',
    },
    {
      description: 'COLECISTECTOMIA',
      definition: 'COLECISTECTOMIA',
      template: '',
    },
    {
      description: 'COLECTOMIA TOTAL',
      definition: 'COLECTOMIA TOTAL',
      template: '',
    },
    {
      description: 'COLETA DE SANGUE PARA TRANSFUSÃO',
      definition: 'COLETA DE SANGUE PARA TRANSFUSÃO',
      template: '',
    },
    {
      description: 'COLONOSCOPIA',
      definition: 'COLONOSCOPIA',
      template: '',
    },
    {
      description: 'COMPLEXO RESPIRATÓRIO FELINO',
      definition: 'COMPLEXO RESPIRATÓRIO FELINO',
      template: '',
    },
    {
      description: 'CORPO ESTRANHO ESOFÂGICO',
      definition: 'CORPO ESTRANHO ESOFÂGICO',
      template: '',
    },
    {
      description: 'CORPO ESTRANHO GÁSTRICO',
      definition: 'CORPO ESTRANHO GÁSTRICO',
      template: '',
    },
    {
      description: 'CORPO ESTRANHO INTESTINAL',
      definition: 'CORPO ESTRANHO INTESTINAL',
      template: '',
    },
    {
      description: 'CURVA GLICÊMICA',
      definition: 'CURVA GLICÊMICA',
      template: '',
    },
    {
      description: 'DDIV',
      definition: 'DDIV',
      template: '',
    },
    {
      description: 'DEMODICOSE',
      definition: 'DEMODICOSE',
      template: '',
    },
    {
      description: 'DERMATOFITOSE',
      definition: 'DERMATOFITOSE',
      template: '',
    },
    {
      description: 'DERMATOPATIA',
      definition: 'DERMATOPATIA',
      template: '',
    },
    {
      description: 'DIABETES MELLITUS',
      definition: 'DIABETES MELLITUS',
      template: '',
    },
    {
      description: 'DIARRÉIA',
      definition: 'DIARRÉIA',
      template: '',
    },
    {
      description: 'DISPLASIA COXOFEMORAL',
      definition: 'DISPLASIA COXOFEMORAL',
      template: '',
    },
    {
      description: 'DOENÇA INFLAMATÓRIA INTESTINAL',
      definition: 'DOENÇA INFLAMATÓRIA INTESTINAL',
      template: '',
    },
    {
      description: 'DOENÇA PERIODONTAL',
      definition: 'DOENÇA PERIODONTAL',
      template: '',
    },
    {
      description: 'DRC',
      definition: 'DRC',
      template: '',
    },
    {
      description: 'DTUIF (DOENÇA DO TRATO URINÁRIO INFERIOR FELINO)',
      definition: 'DTUIF (DOENÇA DO TRATO URINÁRIO INFERIOR FELINO)',
      template: '',
    },
    {
      description: 'ECLÂMPSIA',
      definition: 'ECLÂMPSIA',
      template: '',
    },
    {
      description: 'ENTEROTOMIA',
      definition: 'ENTEROTOMIA',
      template: '',
    },
    {
      description: 'ENTRÓPIO',
      definition: 'ENTRÓPIO',
      template: '',
    },
    {
      description: 'ENUCLEAÇÃO',
      definition: 'ENUCLEAÇÃO',
      template: '',
    },
    {
      description: 'EPILEPSIA (CONVULSÃO)',
      definition: 'EPILEPSIA (CONVULSÃO)',
      template: '',
    },
    {
      description: 'ERLIQUIOSE',
      definition: 'ERLIQUIOSE',
      template: '',
    },
    {
      description: 'ESOFAGOSTOMIA - TUBO ESOFÁGICO',
      definition: 'ESOFAGOSTOMIA - TUBO ESOFÁGICO',
      template: '',
    },
    {
      description: 'ESPLENECTOMIA TOTAL',
      definition: 'ESPLENECTOMIA TOTAL',
      template: '',
    },
    {
      description: 'ESTAFILECTOMIA',
      definition: 'ESTAFILECTOMIA',
      template: '',
    },
    {
      description: 'EVENTRAÇÃO',
      definition: 'EVENTRAÇÃO',
      template: '',
    },
    {
      description: 'EVISCERAÇÃO',
      definition: 'EVISCERAÇÃO',
      template: '',
    },
    {
      description: 'EXCISÃO DE NEOPLASMA',
      definition: 'EXCISÃO DE NEOPLASMA',
      template: '',
    },
    {
      description: 'EXTRAÇÃO DE DENTE DECÍDUO',
      definition: 'EXTRAÇÃO DE DENTE DECÍDUO',
      template: '',
    },
    {
      description: 'FEBRE',
      definition: 'FEBRE',
      template: '',
    },
    {
      description: 'FeLV (LEUCEMIA VIRAL FELINA)',
      definition: 'FeLV (LEUCEMIA VIRAL FELINA)',
      template: '',
    },
    {
      description: 'FERIDA',
      definition: 'FERIDA',
      template: '',
    },
    {
      description: 'FIV (IMUNODEFICIENCIA VIRAL FELINA)',
      definition: 'FIV (IMUNODEFICIENCIA VIRAL FELINA)',
      template: '',
    },
    {
      description: 'FRATURA',
      definition: 'FRATURA',
      template: '',
    },
    {
      description: 'GASTRITE',
      definition: 'GASTRITE',
      template: '',
    },
    {
      description: 'GASTROPEXIA',
      definition: 'GASTROPEXIA',
      template: '',
    },
    {
      description: 'GASTROTOMIA',
      definition: 'GASTROTOMIA',
      template: '',
    },
    {
      description: 'GEH',
      definition: 'GEH',
      template: '',
    },
    {
      description: 'GIARDIA / ISOSPORA',
      definition: 'GIARDIA / ISOSPORA',
      template: '',
    },
    {
      description: 'HÉRNIA INGUINAL',
      definition: 'HÉRNIA INGUINAL',
      template: '',
    },
    {
      description: 'HÉRNIA PERINEAL',
      definition: 'HÉRNIA PERINEAL',
      template: '',
    },
    {
      description: 'HÉRNIA UMBILICAL',
      definition: 'HÉRNIA UMBILICAL',
      template: '',
    },
    {
      description: 'HIDROMETRA',
      definition: 'HIDROMETRA',
      template: '',
    },
    {
      description: 'IMOBILIZAÇÃO EXTERNA',
      definition: 'IMOBILIZAÇÃO EXTERNA',
      template: '',
    },
    {
      description: 'INDISCRIÇÃO ALIMENTAR',
      definition: 'INDISCRIÇÃO ALIMENTAR',
      template: '',
    },
    {
      description: 'INTOXICAÇÃO',
      definition: 'INTOXICAÇÃO',
      template: '',
    },
    {
      description: 'IPE (INSUFICIÊNCIA PANCREÁTICA EXÓGENA)',
      definition: 'IPE (INSUFICIÊNCIA PANCREÁTICA EXÓGENA)',
      template: '',
    },
    {
      description: 'IRA (INSUFICIÊNCIA RENAL AGUDA)',
      definition: 'IRA (INSUFICIÊNCIA RENAL AGUDA)',
      template: '',
    },
    {
      description: 'KCS',
      definition: 'KCS',
      template: '',
    },
    {
      description: 'LAPAROTOMIA EXPLORATÓRIA',
      definition: 'LAPAROTOMIA EXPLORATÓRIA',
      template: '',
    },
    {
      description: 'LINFADENECTOMIA',
      definition: 'LINFADENECTOMIA',
      template: '',
    },
    {
      description: 'LUXAÇÃO MEDIAL DE PATELA',
      definition: 'LUXAÇÃO MEDIAL DE PATELA',
      template: '',
    },
    {
      description: 'MANDIBULECTOMIA',
      definition: 'MANDIBULECTOMIA',
      template: '',
    },
    {
      description: 'MASTECTOMIA BILATERAL REGIONAL',
      definition: 'MASTECTOMIA BILATERAL REGIONAL',
      template: '',
    },
    {
      description: 'MASTECTOMIA BILATERAL TOTAL',
      definition: 'MASTECTOMIA BILATERAL TOTAL',
      template: '',
    },
    {
      description: 'MASTECTOMIA UNILATERAL REGIONAL',
      definition: 'MASTECTOMIA UNILATERAL REGIONAL',
      template: '',
    },
    {
      description: 'MASTECTOMIA UNILATERAL TOTAL',
      definition: 'MASTECTOMIA UNILATERAL TOTAL',
      template: '',
    },
    {
      description: 'MICROCHIPAGEM',
      definition: 'MICROCHIPAGEM',
      template: '',
    },
    {
      description: 'MUCOMETRA',
      definition: 'MUCOMETRA',
      template: '',
    },
    {
      description: 'NEFRECTOMIA TOTAL',
      definition: 'NEFRECTOMIA TOTAL',
      template: '',
    },
    {
      description: 'NEUROPATIA',
      definition: 'NEUROPATIA',
      template: '',
    },
    {
      description: 'NODULECTOMIA',
      definition: 'NODULECTOMIA',
      template: '',
    },
    {
      description: 'NÓDULO CUTÂNEO',
      definition: 'NÓDULO CUTÂNEO',
      template: '',
    },
    {
      description: 'NÓDULO EM MAMA',
      definition: 'NÓDULO EM MAMA',
      template: '',
    },
    {
      description: 'OBESIDADE',
      definition: 'OBESIDADE',
      template: '',
    },
    {
      description: 'ORQUIECTOMIA ELETIVA',
      definition: 'ORQUIECTOMIA ELETIVA',
      template: '',
    },
    {
      description: 'OSH ELETIVA',
      definition: 'OSH ELETIVA',
      template: '',
    },
    {
      description: 'OSH TERAPÊUTICA',
      definition: 'OSH TERAPÊUTICA',
      template: '',
    },
    {
      description: 'OSTEOMIELITE',
      definition: 'OSTEOMIELITE',
      template: '',
    },
    {
      description: 'OSTEOSSÍNTESE',
      definition: 'OSTEOSSÍNTESE',
      template: '',
    },
    {
      description: 'OTITE',
      definition: 'OTITE',
      template: '',
    },
    {
      description: 'OTOHEMATOMA',
      definition: 'OTOHEMATOMA',
      template: '',
    },
    {
      description: 'PANCREATITE',
      definition: 'PANCREATITE',
      template: '',
    },
    {
      description: 'PARAPLEGIA',
      definition: 'PARAPLEGIA',
      template: '',
    },
    {
      description: 'PARTO ASSISTIDO',
      definition: 'PARTO ASSISTIDO',
      template: '',
    },
    {
      description: 'PARVOVIROSE',
      definition: 'PARVOVIROSE',
      template: '',
    },
    {
      description: 'PICADA DE INSETO',
      definition: 'PICADA DE INSETO',
      template: '',
    },
    {
      description: 'PIOMETRA',
      definition: 'PIOMETRA',
      template: '',
    },
    {
      description: 'PNEUMONIA',
      definition: 'PNEUMONIA',
      template: '',
    },
    {
      description: 'PROBLEMA DE PELE',
      definition: 'PROBLEMA DE PELE',
      template: '',
    },
    {
      description: 'PROFILAXIA DENTÁRIA',
      definition: 'PROFILAXIA DENTÁRIA',
      template: '',
    },
    {
      description: 'PROTUSÃO DE GLÂNDULA DA 3ª PÁLPEBRA',
      definition: 'PROTUSÃO DE GLÂNDULA DA 3ª PÁLPEBRA',
      template: '',
    },
    {
      description: 'PRURIDO',
      definition: 'PRURIDO',
      template: '',
    },
    {
      description: 'PSEUDOCIESE',
      definition: 'PSEUDOCIESE',
      template: '',
    },
    {
      description: 'REAÇÃO ALÉRGICA',
      definition: 'REAÇÃO ALÉRGICA',
      template: '',
    },
    {
      description: 'RECUSA DE INTERNAÇÃO',
      definition: 'RECUSA DE INTERNAÇÃO',
      template: '',
    },
    {
      description: 'RINOPLASTIA',
      definition: 'RINOPLASTIA',
      template: '',
    },
    {
      description: 'RUPTURA DE LIGAMENTO CRUZADO CRANIAL',
      definition: 'RUPTURA DE LIGAMENTO CRUZADO CRANIAL',
      template: '',
    },
    {
      description: 'SARNA OTODECICA',
      definition: 'SARNA OTODECICA',
      template: '',
    },
    {
      description: 'SEPSE',
      definition: 'SEPSE',
      template: '',
    },
    {
      description: 'SEPULTAMENTO GLÂNDULA DA 3ª PÁLPEBRA',
      definition: 'SEPULTAMENTO GLÂNDULA DA 3ª PÁLPEBRA',
      template: '',
    },
    {
      description: 'SÍNDROME DA CAUDA EQUINA',
      definition: 'SÍNDROME DA CAUDA EQUINA',
      template: '',
    },
    {
      description: 'TCE',
      definition: 'TCE',
      template: '',
    },
    {
      description: 'TORACOTOMIA',
      definition: 'TORACOTOMIA',
      template: '',
    },
    {
      description: 'TORÇÃO GÁSTRICA',
      definition: 'TORÇÃO GÁSTRICA',
      template: '',
    },
    {
      description: 'TOSSE',
      definition: 'TOSSE',
      template: '',
    },
    {
      description: 'TRAQUEOSTOMIA',
      definition: 'TRAQUEOSTOMIA',
      template: '',
    },
    {
      description: 'TRAUMA TORÁCICO',
      definition: 'TRAUMA TORÁCICO',
      template: '',
    },
    {
      description: 'TRÍADE NEONATAL',
      definition: 'TRÍADE NEONATAL',
      template: '',
    },
    {
      description: 'ÚLCERA DE CÓRNEA',
      definition: 'ÚLCERA DE CÓRNEA',
      template: '',
    },
    {
      description: 'URETROTOMIA',
      definition: 'URETROTOMIA',
      template: '',
    },
    {
      description: 'UROLITÍASE (VESICAL, URETRAL OU URETERAL)',
      definition: 'UROLITÍASE (VESICAL, URETRAL OU URETERAL)',
      template: '',
    },
    {
      description: 'UVEÍTE',
      definition: 'UVEÍTE',
      template: '',
    },
    {
      description: 'VACINA',
      definition: 'VACINA',
      template: '',
    },
    {
      description: 'VÔMITO',
      definition: 'VÔMITO',
      template: '',
    },
  ];

  public async run() {
    const timeline = await TimelineType.findOrFail(PATHOLOGY_UUID);

    await Pathology.fetchOrCreateMany(
      'description',
      this.BASE.map(elem => ({
        description: elem.description,
        definition: elem.definition,
        template: elem.template,
        timeline_type_id: timeline.id,
      })),
    );
  }
}
