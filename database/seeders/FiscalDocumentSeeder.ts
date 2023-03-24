import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import FiscalDocument, {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';

export default class extends BaseSeeder {
  private BASE: Array<Partial<FiscalDocument>> = [
    {
      documentType: FiscalDocumentType.P,
      movementType: FiscalDocumentMovementType.A,
      description: 'NFe - Nota Fiscal Eletronica',
      model: '55',
      imageName: 'iconeNFe.png',
    },
    {
      documentType: FiscalDocumentType.P,
      movementType: FiscalDocumentMovementType.S,
      description: 'NFCe - Nota Fiscal Consumidor Eletronica',
      model: '65',
      imageName: 'iconeNFCe.png',
    },
    {
      documentType: FiscalDocumentType.S,
      movementType: FiscalDocumentMovementType.S,
      description: 'NFSe - Nota Fiscal Serviços Eletronica',
      model: '0',
      imageName: 'iconeNFSe.png',
    },
  ];
  public async run() {
    await FiscalDocument.fetchOrCreateMany('description', this.BASE);
  }
}
