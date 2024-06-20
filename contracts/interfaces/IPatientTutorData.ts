import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import { PatientGender } from "App/Models/Patient";
import { TutorResidences } from "App/Models/PatientTutor";
import { DateTime } from "luxon";

export default interface IPatientTutorData {
	name: string;
	clientOriginId: string;
	clientOriginItemDescription?: string;
	residence?: (typeof TutorResidences)[number];
	photo?: MultipartFileContract;
	gender?: PatientGender;
	tags?: string;
	birthDate?: DateTime;
	active?: boolean;
	document?: string;
	inscription?: string;
	corporate_name?: string;
	email?: string;
	cellphone?: string;
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
	};
	cityCode?: string;
	diabetes?: boolean;
	hypertension?: boolean;
	professionId?: number;
	nationality?: string;
	civilStatus?: string;
}
