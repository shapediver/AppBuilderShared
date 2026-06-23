import type {IFilterableDatabaseSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export interface DatabaseTable {
	rows: string[][];
}

export interface FilterableDatabaseEngine {
	fetch(href: string): Promise<string>;
	parse(raw: string): DatabaseTable;
}

export type FilterSelection = Record<number, string[]>;

export interface FilterableDatabaseContext {
	settings: IFilterableDatabaseSettings;
	table: DatabaseTable;
	selection: FilterSelection;
}
