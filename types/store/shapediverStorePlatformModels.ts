import { 
	SdPlatformModelQueryEmbeddableFields,
	SdPlatformResponseModelPublic, 
} from "@shapediver/sdk.platform-api-sdk-v1";
import { 
	IPlatformItem,
	IPlatformPagedItemQueryProps,
	IShapeDiverStorePlatformGeneric,
	IShapeDiverStorePlatformGenericExtended
} from "@AppBuilderShared/types/store/shapediverStorePlatformGeneric";

/**
 * Actions that can be taken on a model.
 */
export interface TModelActions {
    /** Bookmark the model. */
    bookmark: () => Promise<unknown>
    /** Un-bookmark the model. */
    unbookmark: () => Promise<unknown>,
    /** Confirm the model (organization). */
    confirmForOrganization: () => Promise<unknown>,
    /** Revoke the model (organization). */
    revokeForOrganization: () => Promise<unknown>,
}

/** The data type for model items. */
export type TModelData = SdPlatformResponseModelPublic;

/** The model item type. */
export type TModelItem = IPlatformItem<TModelData, TModelActions>; 

/** The data type for model query response items (just the model id). */
export type TModelQueryItem = string;

/** The embeddable field type for models. */
export type TModelEmbed = SdPlatformModelQueryEmbeddableFields;

/** Extended query properties. */
export type TModelQueryPropsExt = {
    /** 
	 * Whether to add a further filter to the model query.
	 * If true, filter by the current user.
	 * If a string, filter by the given user ID.
	 */
	filterByUser?: boolean | string,
	/** 
	 * Whether to add a further filter to the model query.
	 * If true, filter by the current organization.
	 * If a string, filter by the given organization ID.
	 */
	filterByOrganization?: boolean | string,
}

/** Model query props. */
export type TModelQueryProps = IPlatformPagedItemQueryProps<TModelEmbed, TModelQueryPropsExt>;

/** The type of the model store. */
export type IShapeDiverStorePlatformModel 
    = IShapeDiverStorePlatformGeneric<
        TModelData, 
        TModelActions, 
        TModelEmbed, 
        TModelQueryItem, 
        TModelQueryPropsExt
    >;

/** Typically used cache keys. */
export enum ModelCacheKeyEnum {
    AllModels = "allModels",
    OrganizationModels = "organizationModels",
    MyModels = "myModels",
    TeamModels = "teamModels",
    BookmarkedModels = "bookmarkedModels",
    OrganizationConfirmedModels = "organizationConfirmedModels",
}

/** The type of the extended model store. */
export type IShapeDiverStorePlatformModelExtended 
    = IShapeDiverStorePlatformGenericExtended<
        TModelData, 
        TModelActions, 
        TModelEmbed, 
        TModelQueryItem, 
        TModelQueryPropsExt,
        ModelCacheKeyEnum
    >;
