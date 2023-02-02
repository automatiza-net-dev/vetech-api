import { test } from '@japa/runner';
import FocusNfeService from 'App/Services/FocusNfeService';

test.group('Focus nfe resource', () => {
  const service = new FocusNfeService();

  // test('should send a new nfe request', async ({ assert }) => {
  //   const result = await service.sendNfe(v4(), {
  //     issuedAt: '2018-03-21T11:00:00',
  //     purpose: '1',
  //     cnpj: '48886094000174',
  //     ie: '9097826436',
  //     seller: {
  //       location: {
  //         street: 'Rua Quinze de Abril',
  //         number: '99',
  //         district: 'Jd Paulistano',
  //         city: 'Curitiba',
  //         uf: 'PR',
  //         code: '82320030',
  //       },
  //     },
  //     buyer: {
  //       name: 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO',
  //       document: '03055054911',
  //       phone: '1196185555',
  //       location: {
  //         street: 'Rua São Januário',
  //         number: '99',
  //         district: 'Crespo',
  //         city: 'Manaus',
  //         uf: 'AM',
  //         code: '69073178',
  //       },
  //     },
  //     values: {
  //       base_icms: '0',
  //       icms_value: '0',
  //       icms_base: '0',
  //       icms_total_value: '0',

  //       ipi: '0',
  //       pis: '0',
  //       cofins: '0',

  //       product: '47.23',
  //       delivery: '0.0',
  //       discount: '0.0',
  //       total: '47.23',
  //       other: '0.0',
  //     },
  //     items: [
  //       {
  //         index: '1',
  //         code: v4(),
  //         description: 'Algum produto',
  //         cfop: '5923',
  //         quantity: '1',
  //         value: '47.23',
  //         total: '47.23',
  //         unity: '47.23',
  //         ncm: '49111090',

  //         icms_origin: '0',
  //         icms_base: '0',
  //         icms_total_value: '0',
  //         icms_base_st: '0',
  //         icms_total_value_st: '0',

  //         cst_icms: '400',
  //         cst_pis: '02',
  //         cst_cofins: '01',
  //       },
  //     ],
  //   });

  //   assert.isNull(result);
  // });

  test('should get nfe', async ({ assert }) => {
    const result = await service.getNfe('388ef09a-5fb4-4249-8762-3ace567cd55f');

    console.log(result);

    assert.isNotNull(result);
  });
});
