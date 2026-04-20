export interface IShapeDiverExampleModel {
	slug: string;
	ticket: string;
	modelViewUrl: string;
}

export interface IShapeDiverExampleModels {
	[key: string]: IShapeDiverExampleModel;
}
