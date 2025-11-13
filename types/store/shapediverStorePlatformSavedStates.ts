import {
	IPlatformItem,
	IPlatformPagedItemQueryProps,
	IShapeDiverStorePlatformGeneric,
	IShapeDiverStorePlatformGenericExtended,
} from "@AppBuilderShared/types/store/shapediverStorePlatformGeneric";
import {
	SdPlatformRequestSavedStatePatch,
	SdPlatformResponseSavedStatePublic,
	SdPlatformSavedStateQueryEmbeddableFields,
} from "@shapediver/sdk.platform-api-sdk-v1";

/**
 * Actions that can be taken on a saved state.
 */
export interface TSavedStateActions {
	/** Update the saved state. */
	update: (body: SdPlatformRequestSavedStatePatch) => Promise<unknown>;
	/** Delete the saved state. */
	delete: () => Promise<unknown>;
}

/** The data type for saved state items. */
export type TSavedStateData = SdPlatformResponseSavedStatePublic;

/** The model item type. */
export type TSavedStateItem = IPlatformItem<
	TSavedStateData,
	TSavedStateActions
>;

/** The data type for model query response items (just the saved state id). */
export type TSavedStateQueryItem = string;

/** The embeddable field type for saved states. */
export type TSavedStateEmbed = SdPlatformSavedStateQueryEmbeddableFields;

/** Extended query properties. */
export type TSavedStateQueryPropsExt = {
	/**
	 * Whether to add a further filter to the saved state query.
	 * If true, filter saved states owned by the current user.
	 * If a string, filter saved states owned by the given user ID.
	 */
	filterByUser?: boolean | string;
	/**
	 * Whether to add a further filter to the saved state query.
	 * If true, filter saved states owned by the current organization.
	 * If a string, filter saved states owned by the given organization ID.
	 */
	filterByOrganization?: boolean | string;
	/**
	 * Whether to add a further filter to the saved state query.
	 * If true, filter saved states of the current model.
	 * If a string, filter saved states owned by the given model ID.
	 */
	filterByModel?: boolean | string;
};

/** Model query props. */
export type TSavedStateQueryProps = IPlatformPagedItemQueryProps<
	TSavedStateEmbed,
	TSavedStateQueryPropsExt
>;

/** The type of the saved state store. */
export type IShapeDiverStorePlatformSavedState =
	IShapeDiverStorePlatformGeneric<
		TSavedStateData,
		TSavedStateActions,
		TSavedStateEmbed,
		TSavedStateQueryItem,
		TSavedStateQueryPropsExt
	>;

/** Typically used cache keys. */
export enum SavedStateCacheKeyEnum {
	AllSavedStates = "allSavedStates",
	OrganizationSavedStates = "organizationSavedStates",
	MySavedStates = "mySavedStates",
	SharedSavedStates = "sharedSavedStates",
	PublicSavedStates = "publicSavedStates",
}

/** The type of the extended saved state store. */
export type IShapeDiverStorePlatformSavedStateExtended =
	IShapeDiverStorePlatformGenericExtended<
		TSavedStateData,
		TSavedStateActions,
		TSavedStateEmbed,
		TSavedStateQueryItem,
		TSavedStateQueryPropsExt,
		SavedStateCacheKeyEnum
	> & {
		/** The initial saved state to be applied on load, indexed by session ID */
		initialSavedState: Record<string, TSavedStateData | undefined>;
		/** Set the initial saved state for a specific session */
		setInitialSavedState: (
			sessionId: string,
			savedState: TSavedStateData | undefined,
		) => void;
		/** Handle initial saved state from query parameter */
		handleInitialSavedState: (sessionId: string) => Promise<void>;
		/** The currently selected saved state ID, indexed by session ID */
		selectedSavedStateId: Record<string, string | undefined>;
		/** Set the selected saved state ID for a specific session */
		setSelectedSavedStateId: (
			sessionId: string,
			savedStateId: string | undefined,
		) => void;
		/** Flag indicating if a saved state is currently being applied, indexed by session ID */
		isExecuting: Record<string, boolean>;
		/** Set the isExecuting flag for a specific session */
		setIsExecuting: (sessionId: string, isExecuting: boolean) => void;
	};

export const QUERY_SAVED_STATE_ID = "savedStateId";
