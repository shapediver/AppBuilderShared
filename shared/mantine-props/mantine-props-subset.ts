export type MantinePropsSubset<MantineProps, Mirror> = Mirror extends Partial<MantineProps>
	? true
	: never;
