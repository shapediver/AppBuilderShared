import {
	SelectComponent,
	SelectComponentPropsExt,
	useShapeDiverStoreParameters,
} from "@AppBuilderLib/entities/parameter";
import {
	AppBuilderContainerContext,
	IAppBuilderWidgetPropsSavedStates,
	ISelectComponentItemDataType,
	SavedStatesVisualization,
	SelectComponentType,
} from "@AppBuilderLib/features/appbuilder";
import {
	TSavedStateQueryProps,
	useShapeDiverStorePlatformSavedStates,
} from "@AppBuilderLib/features/model-state";
import {QUERYPARAM_SAVEDSTATEID} from "@AppBuilderLib/shared/config";
import {
	applySavedStateToUrl,
	Logger,
	URL_CHANGED_EVENT,
} from "@AppBuilderLib/shared/lib";
import {useShapeDiverStorePlatform} from "@AppBuilderLib/shared/model";
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
import React, {useContext, useEffect, useMemo, useState} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import {useShallow} from "zustand/react/shallow";

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
			limit: 10,
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

	const parameters = useMemo<URLSearchParams>(
		() => new URLSearchParams(window.location.search),
		[],
	);
	const initialSavedStateId = useMemo(
		() => parameters.get(QUERYPARAM_SAVEDSTATEID),
		[parameters],
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
			};
		});

		return {items, itemData};
	}, [savedStateIds, savedStateItems]);

	const [selectedValue, setSelectedValue] = useState<string | null>(null);
	const handleChange = async (value: string | null) => {
		if (namespace && value) {
			// Set selected saved state ID
			setSelectedValue(value);

			// Apply saved state parameters
			const savedStateItem = savedStateItems[value];
			try {
				if (savedStateItem?.data?.parameters) {
					await batchParameterValueUpdate(
						{
							[namespace]: savedStateItem.data.parameters,
						},
						false,
					);
				}

				// Update query parameter in URL
				applySavedStateToUrl(value, true);
			} catch (error) {
				Logger.error("Failed to apply saved state:", error);
			}
		} else {
			setSelectedValue(null);
		}
	};

	// Keep track of window location search to detect query parameter changes
	const [windowLocationSearch, setWindowLocationSearch] = useState(
		window.location.search,
	);

	// NOTE: savedStateIds updates regularly (e.g., during infinite scroll fetching),
	// causing this hook to re-execute. This may trigger unnecessary state updates.
	// TODO: If initialSavedStateId is not found in savedStateIds, we should ideally
	// continue fetching until it's found or we reach the end of the list.
	// For now, this edge case is not handled.
	useEffect(() => {
		if (
			initialSavedStateId &&
			selectedValue !== initialSavedStateId &&
			savedStateIds.includes(initialSavedStateId)
		) {
			setSelectedValue(initialSavedStateId);
		}
	}, [savedStateIds]);

	// Listen to URL changes:
	// - popstate: browser navigation (back/forward)
	// - urlchanged: programmatic URL changes via modifyUrl functions
	useEffect(() => {
		const handler = () => setWindowLocationSearch(window.location.search);
		window.addEventListener("popstate", handler);
		window.addEventListener(URL_CHANGED_EVENT, handler);
		return () => {
			window.removeEventListener("popstate", handler);
			window.removeEventListener(URL_CHANGED_EVENT, handler);
		};
	}, []);

	// listen to the query parameters in the URL and remove the selected value if it is removed
	useEffect(() => {
		const parameters = new URLSearchParams(windowLocationSearch);
		const savedStatesIdParam = parameters.get(QUERYPARAM_SAVEDSTATEID);

		if (!savedStatesIdParam) setSelectedValue(null);
	}, [windowLocationSearch]);

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
