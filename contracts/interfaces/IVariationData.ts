export default interface IVariationData {
	description: string;
	active: boolean;
	options: {
		id?: string;
		description: string;
	}[];
}
