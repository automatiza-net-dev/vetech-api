import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import BillDocument from "App/Models/BillDocument";
import AnimalTimeline from "App/Models/mongoose/AnimalTimeline";
import ProductDocument, {
	type TProductDocumentType,
} from "App/Models/ProductDocument";
import TimelineType from "App/Models/TimelineType";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";

@inject()
export default class ProductDocumentService {
	constructor(private shared: SharedService) {}

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
			const elems = await ProductDocument.query()
				.useTransaction(trx)
				.preload("product")
				.preload("documentTemplate")
				.where("system_id", authCtx.system.id)
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
				const refDoc = await AnimalTimeline.create({
					timeline_id: timelineInfo.id,
					timeline_type: {
						description: timelineInfo.description,
						color: timelineInfo.color,
						requires_observation: timelineInfo.requiresObservation,
					},
					timeline_info: {
						tag: data.patientId,
						type: elem.documentTemplate.description,
						value: elem.documentTemplate.template,
						realizedAt: new Date(),
						technician: {
							id: authCtx.user.id,
							name: authCtx.user.name,
						},
					},
				});

				return BillDocument.create(
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
			});
			await Promise.all(tasks);
		});
	}

	public async printDocument(
		authCtx: AuthContext,
		data: { billDocumentId: number },
	) {
		return Database.transaction(async (trx) => {
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
					"timeline_info.print.date": new Date(),
				},
			});
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
