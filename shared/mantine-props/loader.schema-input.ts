import type {MantineSizeToken} from "./spacing.schema-input";

/** Serializable subset of Mantine `Loader` props for theme `defaultProps`. */
export interface MantineLoaderProps {
	type?: string;
	size?: MantineSizeToken;
}
