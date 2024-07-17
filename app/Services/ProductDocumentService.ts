import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Bill, { TBillDocumentStatus } from "App/Models/Bill";
import BillDocument from "App/Models/BillDocument";
import BillItem from "App/Models/BillItem";
import AnimalTimeline from "App/Models/mongoose/AnimalTimeline";
import ProductDocument, {
	type TProductDocumentType,
} from "App/Models/ProductDocument";
import TimelineType from "App/Models/TimelineType";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";
import { validate } from "uuid";
import TemplateReplacementService from "App/Services/TemplateReplacementService";

@inject()
export default class ProductDocumentService {
	constructor(
		private shared: SharedService,
		private templateService: TemplateReplacementService,
	) {}

	public async index(
		authCtx: AuthContext,
		data: { systemProduct?: string; product?: string },
	) {
		if (!data.systemProduct) {
			throw new BadRequestException(
				"É preciso informar o Produto de Sistema",
				400,
				"E_ERR",
			);
		}

		const qb = ProductDocument.query()
			.preload("documentTemplate")
			.where("system_id", authCtx.system.id)
			.where("system_product_id", data.systemProduct)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.whereRaw("(business_unit_id = ? or business_unit_id is null)", [
				authCtx.unit.id,
			]);

		if (data.product) {
			qb.where("product_id", data.product);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			system_id: elem.system_id,
			system_product_id: elem.system_product_id,
			economic_group_id: elem.economic_group_id,
			business_unit_id: elem.business_unit_id,
			product_id: elem.product_id,
			document_template_id: elem.document_template_id,
			document_template_title: elem.documentTemplate.title,
			type: elem.type,
			active: elem.active,
			origin: elem.origin,
		}));
	}

	public async documentsFromBill(authCtx: AuthContext, billId: string) {
		if (!validate(billId)) {
			throw new BadRequestException("ID da venda inválido");
		}

		const qb = BillDocument.query()
			.preload("generationUser")
			.preload("printUser")
			.preload("documentTemplate")
			.preload("bill")
			.where("economic_group_id", authCtx.group.id)
			.where("bill_id", billId)
			.whereHas("generationUser", (qb) => {
				qb.whereNull("deleted_at");
			})
			.whereHas("documentTemplate", (qb) => {
				qb.whereNull("deleted_at");
			});

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			bill_id: elem.bill_id,
			bill_tag: elem.bill.tag,
			description: elem.documentTemplate.description,
			type: elem.documentTemplate.type,
			template: elem.documentTemplate.template,
			generationUser: elem.generationUser.name,
			printUser: elem.printUser?.name ?? null,
			printedAt: elem.printedAt,
			createdAt: elem.createdAt,
		}));
	}

	public async store(
		authCtx: AuthContext,
		data: {
			systemProductId: number;
			economicGroupId: string;
			businessUnitId: string;
			productId?: string;
			documentTemplateId: string;
			type: TProductDocumentType;
		},
	) {
		return ProductDocument.create({
			system_id: authCtx.system.id,
			system_product_id: data.systemProductId,
			economic_group_id: data.economicGroupId,
			business_unit_id: data.businessUnitId,
			product_id: data.productId,
			document_template_id: data.documentTemplateId,
			type: data.type,
			active: true,
		});
	}

	public async generateDocuments(
		authCtx: AuthContext,
		data: { billId: string; patientId: string },
	) {
		return Database.transaction(async (trx) => {
			const elems = await Database.from("product_documents")
				.select(
					Database.raw(
						"distinct product_documents.document_template_id, document_templates.description, document_templates.template",
					),
				)
				.useTransaction(trx)
				.joinRaw(
					"join document_templates on document_templates.id = product_documents.document_template_id",
				)
				.joinRaw("join products on products.id = product_documents.product_id")
				.where("product_documents.system_id", authCtx.system.id)
				.whereRaw(
					`(product_documents.economic_group_id is null or
       product_documents.economic_group_id = ?)`,
					[authCtx.group.id],
				)
				.whereRaw(
					`(product_documents.business_unit_id is null or
       product_documents.business_unit_id = ?)`,
					[authCtx.unit.id],
				)
				.whereRaw(
					`product_documents.system_product_id in
      (select p2.system_product_id
       from product_variations
                join products p2 on product_variations.product_id = p2.id
                join bill_items on product_variations.id = bill_items.product_variation_id
       where bill_items.bill_id = ?
         and bill_items.data_document is null
         and bill_items.deleted_at is null)`,
					[data.billId],
				);

			const timelineInfo = await TimelineType.firstOrCreate(
				{
					description: "Documento",
				},
				{
					color: "#000000",
					description: "Documento",
					requiresObservation: false,
				},
				{
					client: trx,
				},
			);

			const tasks = elems.map(async (elem) => {
				const renderThing = await this.templateService.renderText(authCtx, {
					documentId: elem.document_template_id,
					userId: authCtx.user.id,
					businessUnitId: authCtx.unit.id,
				});

				const refDoc = await AnimalTimeline.create({
					timeline_id: timelineInfo.id,
					timeline_type: {
						description: timelineInfo.description,
						color: timelineInfo.color,
						requires_observation: timelineInfo.requiresObservation,
					},
					timeline_info: {
						tag: data.patientId,
						type: elem.description,
						value: "key" in renderThing ? renderThing.key : renderThing.text,
						realizedAt: new Date(),
						technician: {
							id: authCtx.user.id,
							name: authCtx.user.name,
						},
						$meta: {
							bill_id: data.billId,
							bill_document_id: null,
						},
					},
				});

				await Bill.query()
					.useTransaction(trx)
					.where("economic_group_id", authCtx.group.id)
					.where("id", data.billId)
					.update({
						documentStatus: "Gerados" as TBillDocumentStatus,
					});

				await BillItem.query()
					.useTransaction(trx)
					.where("bill_id", data.billId)
					.whereNull("deleted_at")
					.update({
						data_document: DateTime.now(),
					});

				const doc = await BillDocument.create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						bill_id: data.billId,
						document_template_id: elem.document_template_id,
						generation_user_id: authCtx.user.id,

						timelineRef: refDoc._id.toString(),
					},
					{ client: trx },
				);

				await AnimalTimeline.findByIdAndUpdate(refDoc._id, {
					"timeline_info.$meta.bill_document_id": doc.id,
				});
			});
			await Promise.all(tasks);
		});
	}

	public async printDocument(
		authCtx: AuthContext,
		data: { billDocumentId?: number; timelineId?: string },
	) {
		return Database.transaction(async (trx) => {
			if (!data.billDocumentId && !data.timelineId) {
				throw new BadRequestException(
					"Um dos dois valores precisa ser informado",
					400,
					"E_ERR",
				);
			}

			const billIds: string[] = [];

			if (data.timelineId) {
				const val = await AnimalTimeline.findByIdAndUpdate(
					data.timelineId,
					{
						$set: {
							"timeline_info.print.user_id": authCtx.user.id,
							"timeline_info.print.user_name": authCtx.user.name,
							"timeline_info.print.date": new Date(),
						},
					},
					{ new: true },
				);

				// @ts-ignore: mongodb
				const key = val?.timeline_info?.$meta?.bill_id;

				if (!!key && typeof key === "string") {
					billIds.push(key);
				}
			}

			if (data.billDocumentId) {
				const elem = await BillDocument.query()
					.useTransaction(trx)
					.where("economic_group_id", authCtx.group.id)
					.where("id", data.billDocumentId)
					.first();
				if (!elem) {
					throw this.shared.ResourceNotFound();
				}

				await elem
					.merge({ printedAt: DateTime.now(), print_user_id: authCtx.user.id })
					.useTransaction(trx)
					.save();

				await AnimalTimeline.findByIdAndUpdate(elem.timelineRef, {
					$set: {
						"timeline_info.print.user_id": authCtx.user.id,
						"timeline_info.print.user_name": authCtx.user.name,
						"timeline_info.print.date": new Date(),
					},
				});

				billIds.push(elem.bill_id);
			}

			if (billIds.length === 0) {
				return;
			}

			const bills = await Bill.query()
				.useTransaction(trx)
				.whereIn("id", billIds);
			const billDocuments = await BillDocument.query()
				.useTransaction(trx)
				.whereIn("bill_id", billIds);

			const tasks = bills.map(async (elem) => {
				return elem
					.merge({
						documentStatus: billDocuments
							.filter((f) => f.bill_id === elem.id)
							.every((f) => !!f.printedAt)
							? "Impressos"
							: "Imp. Pendentes",
					})
					.useTransaction(trx)
					.save();
			});
			await Promise.all(tasks);
		});
	}

	public async destroy(authCtx: AuthContext, id: string) {
		const elem = await ProductDocument.query()
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (
			!elem ||
			(elem.economic_group_id && elem.economic_group_id !== authCtx.group.id) ||
			(elem.business_unit_id && elem.business_unit_id !== authCtx.unit.id)
		) {
			throw this.shared.ResourceNotFound();
		}

		await elem
			.merge({ exclusion_user_id: authCtx.user.id, deletedAt: DateTime.now() })
			.save();
	}
}
