import SelectComponent, {
	SelectComponentPropsExt,
} from "@AppBuilderShared/components/shapediver/parameter/select/SelectComponent";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStorePlatformSavedStates} from "@AppBuilderShared/store/useShapeDiverStorePlatformSavedStates";
import {
	IAppBuilderWidgetPropsSavedStates,
	ISelectComponentItemDataType,
	SavedStatesVisualization,
	SelectComponentType,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {TSavedStateQueryProps} from "@AppBuilderShared/types/store/shapediverStorePlatformSavedStates";
import {
	Alert,
	Flex,
	FlexProps,
	Loader,
	LoaderProps,
	MantineStyleProp,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
	StackProps,
	useProps,
} from "@mantine/core";
import {SdPlatformSortingOrder} from "@shapediver/sdk.platform-api-sdk-v1";
import React, {useContext, useMemo, useState} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverStorePlatform} from "~/shared/store/useShapeDiverStorePlatform";
import {QUERYPARAM_SAVEDSTATEID} from "~/shared/types/shapediver/queryparams";
import {Logger} from "~/shared/utils/logger";

interface StyleProps {
	selectProps?: Partial<SelectComponentPropsExt> & {
		type: SavedStatesVisualization;
	};
	paperProps?: PaperProps;
	stackProps?: StackProps;
	loaderFlexProps?: FlexProps;
	loaderProps?: LoaderProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	selectProps: {
		type: "fullwidthcards",
	},
	paperProps: {
		p: "md",
	},
	stackProps: {
		gap: "md",
	},
	loaderFlexProps: {
		justify: "center",
		align: "center",
	},
};

type AppBuilderSavedStatesWidgetThemePropsType = Partial<StyleProps>;

export function AppBuilderSavedStatesWidgetComponentThemeProps(
	props: AppBuilderSavedStatesWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type Props = IAppBuilderWidgetPropsSavedStates &
	AppBuilderSavedStatesWidgetThemePropsType &
	Partial<TSavedStateQueryProps> & {
		namespace?: string;
		selectType?: SelectComponentType;
	};

export default function AppBuilderSavedStatesWidgetComponent(props: Props) {
	const {
		namespace,
		visualization,
		queryParams = {
			sorters: {created_at: SdPlatformSortingOrder.Desc},
			limit: 5,
		},
		filterByUser,
		filterByOrganization,
		filterByModel = true,
		cacheKey,
		...rest
	} = props;

	const {selectProps, paperProps, stackProps, loaderFlexProps, loaderProps} =
		useProps(
			"AppBuilderSavedStatesWidgetComponent",
			defaultStyleProps,
			rest,
		);

	const context = useContext(AppBuilderContainerContext);

	const {currentModel} = useShapeDiverStorePlatform(
		useShallow((state) => ({
			currentModel: state.currentModel,
		})),
	);

	const {useQuery, items: savedStateItems} =
		useShapeDiverStorePlatformSavedStates(
			useShallow((state) => ({
				useQuery: state.useQuery,
				items: state.items,
			})),
		);

	const {
		loading,
		error,
		items: savedStateIds,
		hasMore: hasNextPage,
		loadMore,
	} = useQuery({
		queryParams,
		filterByUser,
		filterByOrganization,
		filterByModel,
		cacheKey,
	});

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const styleProps: MantineStyleProp = {};
	if (context.orientation === "horizontal") {
		styleProps.height = "100%";
	} else if (context.orientation === "vertical") {
		styleProps.overflowY = "auto";
	}

	/**
	 * see https://www.npmjs.com/package/react-infinite-scroll-hook
	 */
	const [sentryRef] = useInfiniteScroll({
		loading,
		hasNextPage,
		onLoadMore: loadMore,
		// When there is an error, we stop infinite loading.
		// It can be reactivated by setting "error" state as undefined.
		disabled: !!error,
		// `rootMargin` is passed to `IntersectionObserver`.
		// Format: "top right bottom left"
		// For horizontal scrolling: trigger when sentry reaches horizontal center (50% from right edge)
		// For vertical scrolling: trigger 400px before bottom edge
		rootMargin: "0px 0px 400px 0px",
	});

	// Transform saved states into items for select component
	const {items, itemData} = useMemo(() => {
		const items: string[] = [];
		const itemData: Record<string, ISelectComponentItemDataType> = {};

		const savedStateItemsList = savedStateIds
			.map((id) => savedStateItems[id])
			.filter((item) => item !== undefined);

		savedStateItemsList.forEach((savedStateItem) => {
			const savedState = savedStateItem.data;
			const id = savedState.id;
			items.push(id);

			itemData[id] = {
				displayname: savedState.name || savedState.id,
				description: savedState.description,
				imageUrl: savedState.image?.url,
				tooltip: savedState.name,
			};
		});

		return {items, itemData};
	}, [savedStateIds, savedStateItems]);

	const [selectedValue, setSelectedValue] = useState<string | null>(null);
	const handleChange = async (value: string | null) => {
		// Update query parameter
		const url = new URL(window.location.href);
		if (value) {
			url.searchParams.set(QUERYPARAM_SAVEDSTATEID, value);
		} else {
			url.searchParams.delete(QUERYPARAM_SAVEDSTATEID);
		}
		window.history.replaceState({}, "", url.toString());

		if (namespace && value) {
			// Set selected saved state ID
			setSelectedValue(value);

			// Apply saved state parameters
			const savedStateItem = savedStateItems[value];
			if (savedStateItem?.data?.parameters) {
				try {
					await batchParameterValueUpdate(
						{
							[namespace]: savedStateItem.data.parameters,
						},
						false,
					);
				} catch (error) {
					Logger.error("Failed to apply saved state:", error);
				}
			}
		} else {
			setSelectedValue(null);
		}
	};

	if (!currentModel) {
		return null;
	}

	if (error) {
		return (
			<Paper {...paperProps} style={styleProps}>
				<Alert title="Error">{error.message}</Alert>
			</Paper>
		);
	}

	if (items.length === 0 && !hasNextPage) {
		return null;
	}

	return (
		<Paper {...paperProps} style={styleProps}>
			<Stack {...stackProps}>
				<SelectComponent
					value={selectedValue}
					onChange={handleChange}
					items={items}
					itemData={itemData}
					disabled={loading}
					{...selectProps}
					type={visualization ?? selectProps?.type}
				/>
				{(loading || hasNextPage) && (
					<Flex {...loaderFlexProps}>
						<Loader ref={sentryRef} {...loaderProps} />
					</Flex>
				)}
			</Stack>
		</Paper>
	);
}
