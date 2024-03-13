import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import DocumentTemplate from "App/Models/DocumentTemplate";
import TimelineType from "App/Models/TimelineType";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IDocumentTemplateData from "Contracts/interfaces/IDocumentTemplateData";
import Drive from "@ioc:Adonis/Core/Drive";
import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Database from "@ioc:Adonis/Lucid/Database";
import { DateTime } from "luxon";
import Env from "@ioc:Adonis/Core/Env";
import Application from "@ioc:Adonis/Core/Application";
import { PDFEngine } from "chromiumly";

interface ISearch {
	description?: string;
	title?: string;
}

@inject()
export default class DocumentTemplateService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = DocumentTemplate.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id);

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.title) {
			qb.where("title", "ilike", `%${data.title}%`);
		}

		return qb;
	}

	public async show(authCtx: AuthContext, id: string) {
		const template = await DocumentTemplate.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!template) {
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return template;
	}

	public async renderPdf(authCtx: AuthContext, id: string) {
		const template = await DocumentTemplate.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!template) {
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		if (template.type !== "pdf") {
			throw new BadRequestException(
				"Apenas documentos para PDF são válidos",
				400,
				"",
			);
		}

		if (!template.sourceFile) {
			throw new BadRequestException(
				"Documento sem arquivo de referência",
				400,
				"",
			);
		}

		const file = await Drive.use("s3").get(template.sourceFile);
		await Drive.use("local").put(template.sourceFile, file);

		const localFilePath = await Drive.use("local").getUrl(template.sourceFile);
		const fullPath = `${Env.get(
			"LOCAL_DISK_ROOT",
			Application.tmpPath(),
		)}${localFilePath}`;

		console.log({
			localFilePath,
			fullPath,
		});

		const responseBuffer = await PDFEngine.convert({
			files: [fullPath],
		});

		await Drive.use("local").delete(template.sourceFile);

		const key = `${Date.now()}-${template.id}.pdf`;
		await Drive.use("local").put(key, responseBuffer);
		return {
			url: await Drive.use("local").getUrl(key),
		};
	}

	public async store(
		authCtx: AuthContext,
		data: Omit<IDocumentTemplateData, "active">,
	) {
		if (!data.template) {
			throw new BadRequestException("Texto não enviado", 400, "");
		}

		const timeline = await TimelineType.firstOrCreate(
			{
				description: "Documento",
				system_id: authCtx.system.id,
			},
			{
				description: "Documento",
				color: "#000",
				requiresObservation: false,
				system_id: authCtx.system.id,
			},
		);

		return authCtx.group.related("documentTemplates").create({
			timeline_type_id: timeline.id,
			description: data.description,
			title: data.title,
			header: data.header,
			template: data.template,
			system_id: authCtx.system.id,
			type: "text",
		});
	}

	public async uploadFile(
		authCtx: AuthContext,
		data: Omit<IDocumentTemplateData, "active">,
	) {
		return Database.transaction(async (trx) => {
			if (!data.file) {
				throw new BadRequestException("Arquivo não enviado", 400, "");
			}

			const timeline = await TimelineType.firstOrCreate(
				{
					description: "Documento",
					system_id: authCtx.system.id,
				},
				{
					description: "Documento",
					color: "#000",
					requiresObservation: false,
					system_id: authCtx.system.id,
				},
				{
					client: trx,
				},
			);

			const doc = await authCtx.group.related("documentTemplates").create(
				{
					timeline_type_id: timeline.id,
					description: data.description,
					title: data.title,
					header: data.header,
					template: data.template ?? "",
					system_id: authCtx.system.id,
					type: "pdf",
					fileName: data.file.clientName,
					sourceFile: "",
				},
				{
					client: trx,
				},
			);

			const key = await this.uploadFileToS3(data.file, doc);

			return doc.merge({ sourceFile: key }).useTransaction(trx).save();
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IDocumentTemplateData,
	) {
		const template = await this.show(authCtx, id);

		if (!template.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		return template
			.merge({
				description: data.description,
				title: data.title,
				header: data.header,
				template: data.template,
				active: data.active,
			})
			.save();
	}

	public async destroy(authCtx: AuthContext, id: string) {
		const template = await this.show(authCtx, id);

		if (!template.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		await template.softDelete();
	}

	public async getPdf(authCtx: AuthContext, id: string) {
		const template = await DocumentTemplate.query()
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!template) {
			throw this.sharedService.ResourceNotFound();
		}

		if (template.type !== "pdf") {
			throw new BadRequestException("Documento não é do tipo PDF", 400, "");
		}

		const file = await Drive.use("s3").getSignedUrl(
			`documents/${template.sourceFile}`,
			{
				expiresIn: "1m",
			},
		);

		return {
			url: file,
			expiresAt: DateTime.now().plus({ minutes: 1 }),
		};
	}

	private async uploadFileToS3(
		file: MultipartFileContract,
		doc: DocumentTemplate,
	): Promise<string> {
		const key = `${process.env.NODE_ENV ?? "test"}/${doc.id}.${file.extname}`;

		await file.moveToDisk(
			"documents",
			{
				name: key,
				visibility: "private",
				contentType:
					file.extname === "doc"
						? "application/msword"
						: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			},
			"s3",
		);

		// const signedUrl = await Drive.use("s3").getSignedUrl(key, {
		// 	expiresIn: "1m",
		// });

		return `documents/${key}`;
	}
}
