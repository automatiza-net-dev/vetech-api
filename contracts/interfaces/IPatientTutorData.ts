import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import { TutorGender } from "App/Models/Patient";
import { TutorResidences } from "App/Models/PatientTutor";
import { DateTime } from "luxon";

export default interface IPatientTutorData {
	name: string;
	clientOriginId: string;
	clientOriginItemDescription?: string;
	photo?: MultipartFileContract;
	gender?: TutorGender;
	tags?: string;
	birthDate?: DateTime;
	active?: boolean;
	document?: string;
	inscription?: string;
	corporateName?: string;
	telephone?: string;
	message_person_name?: string;
	message_person_phone?: string;
	address?: {
		zipCode?: string;
		logradouro?: string;
		number?: string;
		complemento?: string;
		bairro?: string;
		localidade?: string;
		uf?: string;
		residence?: (typeof TutorResidences)[number];
		ibge?: string;
	};
	diabetes?: boolean;
	hypertension?: boolean;
	professionId?: number;
	nationality?: string;
	civilStatus?: string;
}
