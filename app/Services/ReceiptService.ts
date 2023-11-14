import { inject } from '@adonisjs/fold';
import Database, {
  TransactionClientContract,
} from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Finance, {
  FinanceAccept,
  FinanceOriginFlag,
  FinanceStatus,
} from 'App/Models/Finance';
import Patient, { PatientType } from 'App/Models/Patient';
import PaymentMethod, {
  PaymentMethodTef,
  PaymentMethodUsage,
} from 'App/Models/PaymentMethod';
import Product, { ProductPurpose } from 'App/Models/Product';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import ProductVariation from 'App/Models/ProductVariation';
import Receipt from 'App/Models/Receipt';
import ReceiptItem from 'App/Models/ReceiptItem';
import ReceiptPayment from 'App/Models/ReceiptPayment';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule, {
  MovementCategory,
  MovementType,
} from 'App/Models/TaxationGroupRule';
import UfIcms from 'App/Models/UfIcms';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import { GenerateTag } from 'App/Utils/GenerateTag';
import { DateTime } from 'luxon';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import xmlParser from 'xml2json';
import { z } from 'zod';
import PatientTutor from 'App/Models/PatientTutor';
import Logger from '@ioc:Adonis/Core/Logger';
import IssuedFiscalDocument, {
  IssuedFiscalDocumentContingency,
} from '../Models/IssuedFiscalDocument';
import { BusinessUnitFiscalDocumentMovementType } from '../Models/BusinessUnitFiscalDocument';
import { ReceiptStatus } from '../Models/Receipt';
import BusinessUnit from '../Models/BusinessUnit';
import { format } from 'date-fns';

const schema = z.object({
  nfeProc: z.object({
    NFe: z.object({
      infNFe: z.object({
        ide: z.object({
          cUF: z.string(),
          cNF: z.string(),
          natOp: z.string(),
          mod: z.string(),
          serie: z.string(),
          nNF: z.string(),
          dhEmi: z.string(),
          dhSaiEnt: z.string(),
          tpNF: z.string(),
          idDest: z.string(),
          cMunFG: z.string(),
          tpImp: z.string(),
          tpEmis: z.string(),
          cDV: z.string(),
          tpAmb: z.string(),
          finNFe: z.string(),
          indFinal: z.string(),
          indPres: z.string(),
          procEmi: z.string(),
          verProc: z.string(),
        }),
        emit: z.object({
          CNPJ: z.string(),
          xNome: z.string(),
          xFant: z.string(),
          enderEmit: z.object({
            xLgr: z.string(),
            nro: z.string(),
            xBairro: z.string(),
            cMun: z.string(),
            xMun: z.string(),
            UF: z.string(),
            CEP: z.string(),
            cPais: z.string(),
            xPais: z.string(),
            fone: z.string(),
          }),
          IE: z.string(),
          CRT: z.string(),
        }),
        dest: z.object({
          CPF: z.optional(z.string()),
          CNPJ: z.optional(z.string()),
          xNome: z.string(),
          enderDest: z.object({
            xLgr: z.string(),
            nro: z.string(),
            xCpl: z.string(),
            xBairro: z.string(),
            cMun: z.string(),
            xMun: z.string(),
            UF: z.string(),
            CEP: z.string(),
            cPais: z.string(),
            xPais: z.string(),
            fone: z.string(),
          }),
          indIEDest: z.string(),
          email: z.string(),
        }),
        autXML: z.object({ CNPJ: z.string() }),
        det: z.object({
          prod: z.object({
            cProd: z.string(),
            cEAN: z.string(),
            xProd: z.string(),
            NCM: z.string(),
            CFOP: z.string(),
            uCom: z.string(),
            qCom: z.string(),
            vUnCom: z.string(),
            vProd: z.string(),
            cEANTrib: z.string(),
            uTrib: z.string(),
            qTrib: z.string(),
            vUnTrib: z.string(),
            indTot: z.string(),
          }),
          imposto: z.object({
            ICMS: z.object({
              ICMS00: z.object({
                orig: z.string(),
                CST: z.string(),
                modBC: z.string(),
                vBC: z.string(),
                pICMS: z.string(),
                vICMS: z.string(),
              }),
            }),
            PIS: z.object({
              PISAliq: z.object({
                CST: z.string(),
                vBC: z.string(),
                pPIS: z.string(),
                vPIS: z.string(),
              }),
            }),
            COFINS: z.object({
              COFINSAliq: z.object({
                CST: z.string(),
                vBC: z.string(),
                pCOFINS: z.string(),
                vCOFINS: z.string(),
              }),
            }),
            ICMSUFDest: z.object({
              vBCUFDest: z.string(),
              vBCFCPUFDest: z.string(),
              pFCPUFDest: z.string(),
              pICMSUFDest: z.string(),
              pICMSInter: z.string(),
              pICMSInterPart: z.string(),
              vFCPUFDest: z.string(),
              vICMSUFDest: z.string(),
              vICMSUFRemet: z.string(),
            }),
          }),
          _nItem: z.optional(z.string()),
        }),
        total: z.object({
          ICMSTot: z.object({
            vBC: z.string(),
            vICMS: z.string(),
            vICMSDeson: z.string(),
            vICMSUFDest: z.string(),
            vFCP: z.string(),
            vBCST: z.string(),
            vST: z.string(),
            vFCPST: z.string(),
            vFCPSTRet: z.string(),
            vProd: z.string(),
            vFrete: z.string(),
            vSeg: z.string(),
            vDesc: z.string(),
            vII: z.string(),
            vIPI: z.string(),
            vIPIDevol: z.string(),
            vPIS: z.string(),
            vCOFINS: z.string(),
            vOutro: z.string(),
            vNF: z.string(),
          }),
        }),
        transp: z.object({
          modFrete: z.string(),
          transporta: z.object({
            CNPJ: z.string(),
            xNome: z.string(),
            IE: z.string(),
            xEnder: z.string(),
            xMun: z.string(),
            UF: z.string(),
          }),
          vol: z.object({
            qVol: z.string(),
            pesoL: z.string(),
            pesoB: z.string(),
          }),
        }),
        cobr: z.object({
          fat: z.object({
            nFat: z.string(),
            vOrig: z.string(),
            vDesc: z.string(),
            vLiq: z.string(),
          }),
        }),
        pag: z.object({
          detPag: z.object({
            tPag: z.string(),
            xPag: z.string(),
            vPag: z.string(),
          }),
        }),
        infAdic: z.object({ infCpl: z.string() }),
        infRespTec: z.object({
          CNPJ: z.string(),
          xContato: z.string(),
          email: z.string(),
          fone: z.string(),
        }),
        _versao: z.optional(z.string()),
        _Id: z.optional(z.string()),
      }),
      Signature: z.object({
        SignedInfo: z.object({
          CanonicalizationMethod: z.object({
            _Algorithm: z.optional(z.string()),
          }),
          SignatureMethod: z.object({ _Algorithm: z.optional(z.string()) }),
          Reference: z.object({
            Transforms: z.object({
              Transform: z.array(
                z.object({ _Algorithm: z.optional(z.string()) }),
              ),
            }),
            DigestMethod: z.object({ _Algorithm: z.optional(z.string()) }),
            DigestValue: z.optional(z.string()),
            _URI: z.optional(z.string()),
          }),
        }),
        SignatureValue: z.string(),
        KeyInfo: z.object({
          X509Data: z.object({ X509Certificate: z.string() }),
        }),
        _xmlns: z.optional(z.string()),
      }),
      _xmlns: z.optional(z.string()),
    }),
    protNFe: z.object({
      infProt: z.object({
        tpAmb: z.string(),
        verAplic: z.string(),
        chNFe: z.string(),
        dhRecbto: z.string(),
        nProt: z.string(),
        digVal: z.string(),
        cStat: z.string(),
        xMotivo: z.string(),
      }),
      _versao: z.optional(z.string()),
    }),
    _xmlns: z.optional(z.string()),
    _versao: z.optional(z.string()),
  }),
});

@inject()
export default class ReceiptService {
  constructor(private sharedService: SharedService) {}

  async importFromXml(
    authCtx: AuthContext,
    data: {
      file: MultipartFileContract;
    },
  ) {
    const key = `${authCtx.unit.id}/${data.file.clientName}`;

    await data.file.moveToDisk(
      'receipts',
      {
        name: key,
      },
      'local',
    );

    const fileContents = await Drive.get(`receipts/${key}`);
    let result = {};
    try {
      result = xmlParser.toJson(fileContents.toString(), { object: true });
    } catch (e) {
      Logger.error(e);
      throw new BadRequestException(
        'Não foi possível ler o arquivo',
        400,
        'E_INTERNAL',
      );
    }

    const parsed = schema.safeParse(result);
    if (!parsed.success) {
      console.log(parsed.error.message);
      throw new BadRequestException('Arquivo inválido', 400, 'E_INVALID_FILE');
    }

    if (parsed.data.nfeProc.protNFe.infProt.tpAmb !== '1') {
      throw new BadRequestException(
        'Esta nota fiscal não foi emitida em ambiente de Produção, importação cancelada',
        400,
        'E_NOT_PROD',
      );
    }

    await Database.transaction(async trx => {
      const issuedAlready = await IssuedFiscalDocument.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('access_key', parsed.data.nfeProc.protNFe.infProt.chNFe)
        .where('active', true)
        .preload('bill', query => {
          query.preload('businessUnit');
        })
        .first();
      if (issuedAlready) {
        throw new BadRequestException(
          `Esta nota já foi importada na unidade '${
            issuedAlready.bill?.businessUnit?.identification ??
            'Não identificado'
          }' no dia ${format(
            issuedAlready.authorizationDate.toJSDate(),
            'dd/MM/yyyy',
          )} com a tag '${issuedAlready.bill?.tag ?? '-'}'`,
          400,
          'E_IMPORTED',
        );
      }

      if (parsed.data.nfeProc.NFe.infNFe.dest.CNPJ) {
        const unit = await BusinessUnit.query()
          .useTransaction(trx)
          .where('document', parsed.data.nfeProc.NFe.infNFe.dest.CNPJ)
          .first();

        if (!unit) {
          throw new BadRequestException(
            'CNPJ não percente a nenhuma unidade',
            400,
            'E_INVALID_DOC',
          );
        }

        if (unit.economicGroupId !== authCtx.group.id) {
          throw new BadRequestException(
            `O CNPJ do destinatário desta nota fical é a Unidade "${unit.identification}" e você está logado na Unidade "${authCtx.unit.identification}"`,
            400,
            'E_INVALID_DOC',
          );
        }
      }

      const dailyMovementId = await this.getDailyMovementForImport(
        trx,
        authCtx,
      );

      const supplierId = await this.getSupplierForImport(
        trx,
        parsed.data,
        authCtx,
      );

      const counter = await Receipt.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id);

      await Receipt.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          supplier_id: supplierId,
          user_id: authCtx.user.id,
          seller_id: authCtx.user.id,
          daily_movement_id: dailyMovementId,

          issueDate: DateTime.now(),
          receiptDate: DateTime.now(),
          tag: GenerateTag(counter.length + 1),
          productValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
          discountValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vDesc,
          deliveryValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vFrete,
          totalValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vNF,
          icmsBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vBC,
          icmsValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vICMS,
          icmsStBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vBCST,
          icmsStValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vST,
          pisBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
          pisValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vPIS,
          cofinsBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
          cofinsValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vCOFINS,
          ipiBase: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vProd,
          ipiValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vIPI,
          icmsFcpValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vFCP,
          icmsUfDestinationValue:
            parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vICMSUFDest,
          otherValue: parsed.data.nfeProc.NFe.infNFe.total.ICMSTot.vOutro,
          additionalInformation: parsed.data.nfeProc.NFe.infNFe.infAdic.infCpl,
          status: 'Ativa',
        },
        { client: trx },
      );

      await IssuedFiscalDocument.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          user_who_authorized_id: authCtx.user.id,
          bill_id: undefined, // TODO - complete
          fiscal_document_id: undefined,

          movementType: BusinessUnitFiscalDocumentMovementType.E,
          model: parsed.data.nfeProc.NFe.infNFe.ide.mod,
          series: parsed.data.nfeProc.NFe.infNFe.ide.serie,
          sequence: parseInt(parsed.data.nfeProc.NFe.infNFe.ide.nNF),
          purpose: 'Importação XML',
          accessKey: parsed.data.nfeProc.protNFe.infProt.chNFe,
          authorizationDate: parsed.data.nfeProc.NFe.infNFe.ide.dhEmi,
          authorizationReceiptDate:
            parsed.data.nfeProc.protNFe.infProt.dhRecbto,
          authorizationReceipt: parsed.data.nfeProc.protNFe.infProt.nProt,
          contingency: IssuedFiscalDocumentContingency.N,
          active: true,

          sefazStatusCode: parsed.data.nfeProc.protNFe.infProt.cStat,
          sefazStatus: 'Autorizado',
          sefazMessage: parsed.data.nfeProc.protNFe.infProt.xMotivo,
        },
        { client: trx },
      );
    });
  }

  private async getDailyMovementForImport(
    trx: TransactionClientContract,
    authCtx: AuthContext,
  ): Promise<string> {
    const dailyMovement = authCtx.unit.unitConfig.lockedDailyMovementDate
      ? await DailyMovement.query()
          .useTransaction(trx)
          .where('business_unit_id', authCtx.unit.id)
          .whereRaw('opening_date::date = ?', [new Date()])
          .where('status', DailyMovementStatus.A)
          .first()
      : await DailyMovement.query()
          .useTransaction(trx)
          .where('business_unit_id', authCtx.unit.id)
          .where('status', DailyMovementStatus.A)
          .first();

    if (!dailyMovement) {
      throw new BadRequestException(
        'É necessário ter um movimento diário quando importanto uma nota',
        400,
        'E_NO_DL',
      );
    }

    return dailyMovement.id;
  }

  private async getSupplierForImport(
    trx: TransactionClientContract,
    data: z.infer<typeof schema>,
    authCtx: AuthContext,
  ): Promise<string> {
    const existingTutor = await PatientTutor.query()
      .useTransaction(trx)
      .where('document', data.nfeProc.NFe.infNFe.emit.CNPJ)
      .first();

    // vendedor não existe
    if (!existingTutor) {
      const suppliers = await authCtx.group
        .related('patients')
        .query()
        .useTransaction(trx)
        .where('type', PatientType.SUPPLIER)
        .select('id');

      const newSupplier = await Patient.create(
        {
          name: data.nfeProc.NFe.infNFe.emit.xFant,
          type: PatientType.SUPPLIER,
          tag: (suppliers.length + 1).toString(),
        },
        { client: trx },
      );

      await newSupplier.related('tutor').create({
        document: data.nfeProc.NFe.infNFe.emit.CNPJ,
        inscription: data.nfeProc.NFe.infNFe.emit.IE,
        corporateName: data.nfeProc.NFe.infNFe.emit.xNome,
        cellphone: data.nfeProc.NFe.infNFe.emit.enderEmit.fone,
        telephone: data.nfeProc.NFe.infNFe.emit.enderEmit.fone,
        postalCode: data.nfeProc.NFe.infNFe.emit.enderEmit.CEP,
        street: data.nfeProc.NFe.infNFe.emit.enderEmit.xLgr,
        number: data.nfeProc.NFe.infNFe.emit.enderEmit.nro,
        // complement: data.nfeProc.NFe.infNFe.emit.enderEmit.xCpl,
        district: data.nfeProc.NFe.infNFe.emit.enderEmit.xBairro,
        city: data.nfeProc.NFe.infNFe.emit.enderEmit.xMun,
        state: data.nfeProc.NFe.infNFe.emit.enderEmit.UF,
        cityCode: data.nfeProc.NFe.infNFe.emit.enderEmit.cMun,
        residence: 'COMERCIAL',
      });

      await authCtx.group.related('patients').attach([newSupplier.id], trx);

      return newSupplier.id;
    }

    // checar se vendedor tem relação com grupo
    const tmpPatient = await authCtx.group
      .related('patients')
      .query()
      .useTransaction(trx)
      .where('patient_id', existingTutor.patient_id)
      .first();

    // se não tiver, criar relação
    if (!tmpPatient) {
      await authCtx.group
        .related('patients')
        .attach([existingTutor.patient_id], trx);
    }

    return existingTutor.patient_id;
  }

  async createReceipt(
    authCtx: AuthContext,
    data: {
      supplierId: string;
      dailyMovementId?: string;
      reversalUserId?: string;
      reversalReasonId?: string;
      receiptDate: DateTime;
      otherValue?: number;
      additionalInformation?: string;
      reversalObservation?: string;
      reversedAt?: DateTime;

      items: Array<{
        productVariationId: string;
        quantity: number;
        costValue: number;
        unitaryValue: number;
        discountValue: number;
      }>;
    },
  ) {
    await Database.transaction(async trx => {
      const counter = await Receipt.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id);

      const dailyCashier = await this.sharedService.getContextCashier(
        authCtx,
        trx,
      );

      const receipt = await Receipt.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          supplier_id: data.supplierId,
          user_id: authCtx.user.id,
          seller_id: authCtx.user.id,
          daily_cashier_id: dailyCashier!.id,
          daily_movement_id: data.dailyMovementId,
          reversal_user_id: data.reversalUserId,
          reversal_reason_id: data.reversalReasonId,

          tag: GenerateTag(counter.length + 1),
          issueDate: DateTime.now(),
          receiptDate: data.receiptDate,
          otherValue: data.otherValue,
          additionalInformation: data.additionalInformation,
          reversalObservation: data.reversalObservation,
          reversedAt: data.reversedAt,
          status: 'Ativa',
        },
        { client: trx },
      );

      const tasks = data.items.map(elem => {
        return this.innerCreateItem(trx, authCtx, {
          receiptId: receipt.id,
          productVariationId: elem.productVariationId,
          quantity: elem.quantity,
          costValue: elem.costValue,
          unitaryValue: elem.unitaryValue,
          discountValue: elem.discountValue,
        });
      });
      await Promise.all(tasks);

      await this.syncReceipt(trx, receipt);
    });
  }

  async createItem(
    authCtx: AuthContext,
    data: {
      receiptId: number;
      productVariationId: string;
      quantity: number;
      costValue: number;
      unitaryValue: number;
      discountValue: number;
    },
  ) {
    await Database.transaction(async trx => {
      const receipt = await Receipt.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.receiptId)
        .first();

      if (!receipt) {
        throw this.sharedService.ResourceNotFound();
      }

      await this.innerCreateItem(trx, authCtx, data);
    });
  }

  private async innerCreateItem(
    trx: TransactionClientContract,
    authCtx: AuthContext,
    data: {
      receiptId: number;
      productVariationId: string;
      quantity: number;
      costValue: number;
      unitaryValue: number;
      discountValue: number;
    },
  ) {
    const productVariation = await ProductVariation.query()
      .useTransaction(trx)
      .where('id', data.productVariationId)
      .whereHas('businessUnitProducts', query => {
        query.where('businness_unit_id', authCtx.unit.id);
      })
      .preload('product')
      .preload('businessUnitProducts', query => {
        query.where('businness_unit_id', authCtx.unit.id);
      })
      .first();

    if (!productVariation) {
      throw new BadRequestException(
        'Não foi possível encontrar um preço para esse produto',
        400,
        'E_NO_VARIATION',
      );
    }

    const rule = await TaxationGroupRule.query()
      .useTransaction(trx)
      .whereHas('taxationGroup', query => {
        query.where('id', productVariation.product.taxation_group_id);
      })
      .where('movementType', MovementType.E)
      .where('movementCategory', MovementCategory.NE)
      .where('fromUf', authCtx.unit.state ?? '-')
      .where('toUf', authCtx.unit.state ?? '-')
      .preload('taxationGroup')
      .preload('taxOperation')
      .first();

    const ufIcms = await UfIcms.query()
      .useTransaction(trx)
      .where('origin_uf', rule?.toUf ?? '-')
      .where('destination_uf', rule?.toUf ?? '-')
      .first();

    const totalValue = data.unitaryValue * data.quantity - data.discountValue;
    const icmsBase =
      totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
    const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;
    const icmsStBase_1 = icmsBase + (icmsBase * (rule?.ivaIcmsSt ?? 0)) / 100;
    const icmsStPercentageRedBase = rule?.ivaIcmsSt
      ? rule?.icmsPercRedBaseCalculoST
      : undefined;
    const icmsStBase_2 = rule?.ivaIcmsSt
      ? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
      : 0;

    return ReceiptItem.create(
      {
        economic_group_id: authCtx.group.id,
        business_unit_id: authCtx.unit.id,
        product_variation_id: data.productVariationId,
        receipt_id: data.receiptId,

        quantity: data.quantity,
        costValue: data.costValue,
        unitaryValue: data.unitaryValue,
        discountValue: data.discountValue,
        totalValue: data.unitaryValue * data.quantity - data.discountValue,
        status: 'Ativo',
        issueDate: DateTime.now(),

        tax_operation_id: rule?.tax_operation_id,
        fiscalOperationCode: rule?.taxOperation?.code,

        icmsOriginProduct: productVariation.product.icmsOrigin,
        icmsCst: rule?.icmsCst,
        icmsBase,
        icmsPercentage: rule?.icmsPerc,
        icmsValue,
        icmsDeferredValue: 0,
        icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
        icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
        icmsStBase: this.sharedService.isValidNumber(rule?.ivaIcmsSt)
          ? icmsStBase_2
          : undefined,
        icmsStPercentageRedBase: rule?.icmsPercRedBaseCalculo,
        icmsStIva: rule?.icmsPercRedAliquota,
        icmsStPercentageUfDestination: ufIcms?.icmsPercentage,
        icmsStValue:
          this.sharedService.isValidNumber(rule?.ivaIcmsSt) && ufIcms
            ? icmsStBase_2 * (ufIcms.icmsPercentage / 100) - icmsValue
            : undefined,
        icmsPartitionValue: 0,
        icmsFcpPercentage: rule?.fcpPerc,
        icmsFcpValue: 0,
        icmsPartitionOriginUfPercentage: rule?.icmsPerc,
        icmsPartitionDestinationUfPercentage: ufIcms?.icmsPercentage,
        icmsPartitionInterUfPercentage: ufIcms?.icmsPercentage,

        issCst: rule?.icmsCst,
        issBase: icmsBase,
        issPercentage: rule?.icmsPerc,
        issValue: (icmsBase * (rule?.icmsPerc ?? 1)) / 100,

        pisCst: rule?.pisCst,
        pisBase: totalValue,
        pisPercentage: rule?.pisPerc,
        pisValue: (totalValue * (rule?.pisPerc ?? 1)) / 100,
        pisRetentionValue: 0,

        cofinsCst: rule?.cofinsCst,
        cofinsBase: totalValue,
        cofinsPercentage: rule?.cofinsPerc,
        cofinsValue: (totalValue * (rule?.cofinsPerc ?? 1)) / 100,
        cofinsRetentionValue: 0,

        ipiCst: rule?.ipiCst,
        ipiBase: 0,
        ipiPercentage: rule?.ipiPerc,
        ipiValue: 0,
      },
      {
        client: trx,
      },
    );
  }

  async createPayment(
    authCtx: AuthContext,
    data: {
      receiptId: number;
      items: {
        paymentMethodId: string;
        tefAcquirerId?: string;
        tefFlagId?: string;

        installments: number;
        installmentValue: number;
        issueDate: DateTime;
        expirationDate: DateTime;
        nsuDocument?: string;
      }[];
    },
  ) {
    await Database.transaction(async trx => {
      const receipt = await Receipt.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.receiptId)
        .preload('payments')
        .first();

      if (!receipt) {
        throw this.sharedService.ResourceNotFound();
      }

      const tasks = data.items.map((elem, index) => {
        return ReceiptPayment.create(
          {
            economic_group_id: authCtx.group.id,
            business_unit_id: authCtx.unit.id,
            receipt_id: data.receiptId,
            payment_method_id: elem.paymentMethodId,
            tef_acquirer_id: elem.tefAcquirerId,
            tef_flag_id: elem.tefFlagId,

            block: index + 1 + receipt.payments.length,
            blockInstallments: elem.installments,
            installmentValue: elem.installmentValue,
            issueDate: elem.issueDate,
            expirationDate: elem.expirationDate,
            nsuDocument: elem.nsuDocument,
            status: 'Ativo',
          },
          { client: trx },
        );
      });

      const payments = await Promise.all(tasks);
      const paymentsTasks = payments.map(elem => {
        return this.createFinanceEntry(trx, authCtx, {
          dailyCashierId: receipt.daily_cashier_id,
          dailyMovementId: receipt.daily_movement_id,
          supplierId: receipt.supplier_id,
          paymentMethodId: elem.payment_method_id,
          tefAcquirerId: elem.tef_acquirer_id,
          tefFlagId: elem.tef_flag_id,

          tag: receipt.tag,
          item: elem,
        });
      });
      await Promise.all(paymentsTasks);
    });
  }

  async deleteItem(
    authCtx: AuthContext,
    data: {
      itemId: number;
    },
  ) {
    await Database.transaction(async trx => {
      const thing = await ReceiptItem.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.itemId)
        .preload('receipt')
        .first();

      if (!thing) {
        throw this.sharedService.ResourceNotFound('Item não encontrado');
      }

      await thing
        .merge({
          disabled_user_id: authCtx.user.id,
          disabledDate: DateTime.now(),
          status: 'Excluido',
        })
        .useTransaction(trx)
        .save();

      await this.syncReceipt(trx, thing.receipt);
    });
  }

  async deletePayment(
    authCtx: AuthContext,
    data: {
      paymentId: string;
    },
  ) {
    await Database.transaction(async trx => {
      const thing = await ReceiptPayment.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.paymentId)
        .preload('receipt')
        .first();

      if (!thing) {
        throw this.sharedService.ResourceNotFound('Item não encontrado');
      }

      const existingFinances = await Finance.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('origin_flag', FinanceOriginFlag.E)
        .where('document', `NFE-${thing.receipt.tag}`)
        .where('block', thing.block);
      if (existingFinances.some(f => f.status === FinanceStatus.B)) {
        throw new BadRequestException(
          'Não é possível excluir um pagamento que já foi baixado',
          400,
          'E_PAYMENT_ALREADY_RECEIVED',
        );
      }

      await this.deleteFinanceEntry(trx, authCtx, thing);
    });
  }

  async searchProducts(
    authCtx: AuthContext,
    data: {
      variation?: string;
      reference?: string;
      barcode?: string;
      description?: string;
    },
  ) {
    const qb = Product.query()
      .where('economic_group_id', authCtx.group.id)
      .whereNotIn('purpose', [ProductPurpose.INTERNAL])
      .where('active', true);

    if (data.variation || data.barcode) {
      qb.whereHas('variations', query => {
        if (data.variation) {
          query.where('id', data.variation);
        }
        if (data.barcode) {
          query.where('barcode', 'ilike', `%${data.barcode}%`);
        }
      });
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.reference) {
      qb.where('referenceCode', 'ilike', `%${data.reference}%`);
    }

    qb.preload('variations', query => {
      if (data.variation) {
        query.where('id', data.variation);
      }
      if (data.barcode) {
        query.where('barcode', 'ilike', `%${data.barcode}%`);
      }

      query.where('active', true);
      query.preload('variationOptions');
      query.preload('product', query => {
        query.preload('unit');
      });

      query.preload('businessUnitProducts', query => {
        query.where('businness_unit_id', authCtx.unit.id);
      });
    });

    const products = await qb;

    const variations = products.map(p => p.variations).flat();

    return variations.map(elem => ({
      id: elem.id,
      description: elem.product.description,
      unit: elem.product.unit,
      stock:
        elem.businessUnitProducts.find(
          p => p.businness_unit_id === authCtx.unit.id,
        )?.stock ?? null,
      costPrice:
        elem.businessUnitProducts.find(
          p => p.businness_unit_id === authCtx.unit.id,
        )?.costPrice ?? null,
      referenceCode: elem.product.referenceCode,
      barcode: elem.barcode,
      variationOptions: elem.variationOptions,
    }));
  }

  async searchTax(
    authCtx: AuthContext,
    data: {
      origin?: string;
      destination?: string;
      variation?: string;
    },
  ) {
    const qb = TaxationGroup.query()
      .where('economic_group_id', authCtx.group.id)
      .where('active', true);

    if (data.origin) {
      qb.whereHas('rules', query => {
        query.where('from_uf', data.origin as string);
      });
    }

    qb.whereHas('rules', query => {
      query.where('to_uf', data.destination ?? authCtx.unit.state ?? '-');
    });

    qb.whereHas('rules', query => {
      query.where('movement_type', MovementType.E);
    });

    qb.whereHas('rules', query => {
      query.where('movement_category', MovementCategory.NE);
    });

    qb.preload('rules', query => {
      query.preload('taxOperation');

      query.where('active', true);
      query.where('movement_type', MovementType.E);
      query.where('movement_category', MovementCategory.NE);

      if (data.origin) {
        query.where('from_uf', data.origin);
      }

      if (data.destination) {
        query.where('to_uf', data.destination);
      }
    });

    const result = await qb;

    return result
      .map(tax => tax.rules)
      .flat()
      .map(elem => ({
        idOperacaoFiscal: elem.tax_operation_id,
        codOperacaoFiscal: elem.taxOperation?.code ?? null,
        codBeneficioFiscal: elem.taxBenefitCode,
        icmsCst: elem.icmsCst,
        icmsPerc: elem.icmsPerc,
        icmsPercRedAliquota: elem.icmsPercRedAliquota,
        icmsPercRedBaseCalculo: elem.icmsPercRedBaseCalculo,
        ivaIcmsSt: elem.ivaIcmsSt,
        icmsPercRedBaseCalculoST: elem.icmsPercRedBaseCalculoST,
        icmsPercDiferimento: elem.icmsPercDiferimento,
        ipiCst: elem.ipiCst,
        ipiPerc: elem.ipiPerc,
        pisCst: elem.pisCst,
        pisPerc: elem.pisPerc,
        cofinsCst: elem.cofinsCst,
        cofinsPerc: elem.cofinsPerc,
      }));
  }

  async searchPaymentMethods(authCtx: AuthContext) {
    const result = await PaymentMethod.query()
      .where('economic_group_id', authCtx.group.id)
      .where('active', true)
      .whereIn('usage', [PaymentMethodUsage.RECEBER, PaymentMethodUsage.AMBOS])
      .preload('flags', query => {
        query.preload('flag');
        query.preload('acquirer');
      })
      .preload('fees');

    return result.map(elem => {
      if (elem.tef === PaymentMethodTef.N) {
        return {
          id: elem.id,
          description: elem.description,
          requiresDocument: elem.requiresDocument,
          daysFirstInstallment: elem.daysFirstInstallment,
          daysBetweenInstallments: elem.daysBetweenInstallments,
          allowChangeExpirationDate: elem.allowChangeExpirationDate,
        };
      }

      return {
        id: elem.id,
        description: elem.description,
        requiresDocument: elem.requiresDocument,
        daysFirstInstallment: elem.daysFirstInstallment,
        daysBetweenInstallments: elem.daysBetweenInstallments,
        allowChangeExpirationDate: elem.allowChangeExpirationDate,
        type: elem.type,
        flags: elem.flags.map(elem => {
          return {
            id: elem.id,
            flagId: elem.flag.id,
            acquirerId: elem.acquirer.id,
          };
        }),
        fees: elem.fees.map(elem => {
          return {
            id: elem.id,
            fee: elem.fee,
            installments: elem.installments,
          };
        }),
      };
    });
  }

  private async createFinanceEntry(
    trx: TransactionClientContract,
    authCtx: AuthContext,
    data: {
      dailyMovementId?: string;
      dailyCashierId?: string;
      tefFlagId?: string;
      tefAcquirerId?: string;
      supplierId: string;
      paymentMethodId: string;

      tag: string;
      item: ReceiptPayment;
    },
  ) {
    const supplier = await Patient.query()
      .useTransaction(trx)
      .where('id', data.supplierId)
      .preload('tutor')
      .first();

    if (!supplier) {
      throw new BadRequestException(
        'Fornecedor não encontrado',
        400,
        'E_NOT_FOUND',
      );
    }

    await Finance.create(
      {
        economic_group_id: authCtx.group.id,
        business_unit_id: authCtx.unit.id,

        client_id: data.supplierId,
        daily_cashier_id: data.dailyCashierId,
        daily_movement_id: data.dailyMovementId,
        account_plan_id:
          supplier?.tutor?.account_plan_id ??
          authCtx.unit?.unitConfig?.order_entry_account_plan_id,
        payment_method_id: data.paymentMethodId,
        tef_flag_id: data.tefFlagId,
        acquirer_id: data.tefAcquirerId,
        origin_id: data.item.id,

        block: data.item.block,
        installment: data.item.blockInstallments,
        originFlag: FinanceOriginFlag.E,
        document: `NFE-${data.tag}`,
        historic: `NFE-${data.tag}`,
        issueDate: DateTime.now(),
        expirationDate: data.item.expirationDate,
        originalValue: data.item.installmentValue,
        value: data.item.installmentValue,
        totalValue: data.item.installmentValue * data.item.blockInstallments,
        feeValue: 0,
        feePercentage: 0,
        accept: FinanceAccept.N,
        reconciled: false,
        competenceDate: DateTime.now().toFormat('MM/yyyy'),
        nsuDocument: data.item.nsuDocument,
        status: FinanceStatus.A,
      },
      {
        client: trx,
      },
    );
  }

  private async deleteFinanceEntry(
    trx: TransactionClientContract,
    authCtx: AuthContext,
    payment: ReceiptPayment,
  ) {
    await Finance.query()
      .useTransaction(trx)
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('origin_flag', FinanceOriginFlag.E)
      .where('document', `NFE-${payment.receipt.tag}`)
      .where('block', payment.block)
      .update({
        status: FinanceStatus.E,
        deletedAt: DateTime.now(),
      });
  }

  private async syncReceipt(trx: TransactionClientContract, receipt: Receipt) {
    const items = await ReceiptItem.query()
      .useTransaction(trx)
      .where('economic_group_id', receipt.economic_group_id)
      .where('business_unit_id', receipt.business_unit_id)
      .where('receipt_id', receipt.id)
      .where('status', 'Ativo');

    await receipt
      .merge({
        productValue: this.sharedService.sum(
          items.map(elem => elem.totalValue),
        ),
        serviceValue: 0,
        discountValue: this.sharedService.sum(
          items.map(elem => elem.discountValue),
        ),
        totalValue: this.sharedService.sum(
          items.map(elem => [elem.totalValue, -elem.discountValue]).flat(),
        ),
        deliveryValue: 0,

        icmsBase: this.sharedService.sum(items.map(elem => elem.icmsBase)),
        icmsValue: this.sharedService.sum(items.map(elem => elem.icmsValue)),
        icmsStBase: this.sharedService.sum(items.map(elem => elem.icmsStBase)),
        icmsStValue: this.sharedService.sum(
          items.map(elem => elem.icmsStValue),
        ),
        icmsDeferredValue: this.sharedService.sum(
          items.map(elem => elem.icmsDeferredValue),
        ),
        icmsFcpValue: this.sharedService.sum(
          items.map(elem => elem.icmsFcpValue),
        ),
        icmsUfOriginValue: this.sharedService.sum(
          items.map(elem => elem.icmsPartitionOriginUfValue),
        ),
        icmsUfDestinationValue: this.sharedService.sum(
          items.map(elem => elem.icmsPartitionDestinationUfValue),
        ),

        issValue: this.sharedService.sum(items.map(elem => elem.issValue)),

        pisBase: this.sharedService.sum(items.map(elem => elem.pisBase)),
        pisValue: this.sharedService.sum(items.map(elem => elem.pisValue)),
        pisRetentionValue: this.sharedService.sum(
          items.map(elem => elem.pisRetentionValue),
        ),

        cofinsBase: this.sharedService.sum(items.map(elem => elem.cofinsBase)),
        cofinsValue: this.sharedService.sum(
          items.map(elem => elem.cofinsValue),
        ),
        cofinsRetentionValue: this.sharedService.sum(
          items.map(elem => elem.cofinsRetentionValue),
        ),

        ipiBase: this.sharedService.sum(items.map(elem => elem.ipiBase)),
        ipiValue: this.sharedService.sum(items.map(elem => elem.ipiValue)),
      })
      .useTransaction(trx)
      .save();
  }
}
