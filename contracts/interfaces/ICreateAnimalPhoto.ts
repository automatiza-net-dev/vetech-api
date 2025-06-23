import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import { DateTime } from "luxon";

export default interface ICreateAnimalPhoto {
	tag: string;
	photos: MultipartFileContract[];
	technicianId: string;
	observation?: string;
	title?: string;
	createdAt?: DateTime;
}
