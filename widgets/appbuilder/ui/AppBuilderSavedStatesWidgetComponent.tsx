import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import SelectComponent, {
	type SelectComponentPropsExt,
} from "@AppBuilderLib/entities/parameter/ui/select/SelectComponent";
import {
	IAppBuilderWidgetPropsSavedStates,
	ISelectComponentItemDataType,
	SavedStatesVisualization,
	SelectComponentType,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {TSavedStateQueryProps} from "@AppBuilderLib/features/model-state/config/shapediverStorePlatformSavedStates";
import {useShapeDiverStorePlatformSavedStates} from "@AppBuilderLib/features/model-state/model/useShapeDiverStorePlatformSavedStates";
import {QUERYPARAM_SAVEDSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	applySavedStateToUrl,
	URL_CHANGED_EVENT,
} from "@AppBuilderLib/shared/lib/modifyUrl";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineStackProps} from "@AppBuilderLib/shared/mantine-props/stack";
import {useShapeDiverStorePlatform} from "@AppBuilderLib/shared/model/useShapeDiverStorePlatform";
import {
	Alert,
	Flex,
	FlexProps,
	Loader,
	LoaderProps,
	MantineStyleProp,
	MantineThemeComponent,
	Paper,
	Stack,
	useProps,
} from "@mantine/core";
import {SdPlatformSortingOrder} from "@shapediver/sdk.platform-api-sdk-v1";
import {useContext, useEffect, useMemo, useRef, useState} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import {useShallow} from "zustand/react/shallow";

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderSavedStatesWidgetComponent.defaultProps
 * @displayName AppBuilderSavedStatesWidgetComponent
 */
export interface AppBuilderSavedStatesWidgetComponentStyleProps {
	selectProps?: Partial<SelectComponentPropsExt> & {
		type: SavedStatesVisualization;
	};
	paperProps?: MantinePaperProps;
	stackProps?: MantineStackProps;
	loaderFlexProps?: FlexProps;
	loaderProps?: LoaderProps;
}

const defaultStyleProps: Partial<AppBuilderSavedStatesWidgetComponentStyleProps> =
	{
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

type AppBuilderSavedStatesWidgetThemePropsType =
	Partial<AppBuilderSavedStatesWidgetComponentStyleProps>;

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

	// Load first page without a loader shell (avoids spinner flash when empty).
	const initialFetchStartedRef = useRef(false);
	useEffect(() => {
		if (!currentModel || error || loading) return;
		if (items.length > 0 || !hasNextPage) return;
		if (initialFetchStartedRef.current) return;
		initialFetchStartedRef.current = true;
		void loadMore();
	}, [currentModel, error, loading, items.length, hasNextPage, loadMore]);

	const [selectedValue, setSelectedValue] = useState<string | null>(null);
	const handleChange = async (value: string | null) => {
		if (namespace && value) {
			// Set selected saved state ID
			setSelectedValue(value);

			// Apply saved state parameters
			const savedStateItem = savedStateItems[value];
			try {
				if (savedStateItem?.data?.parameters) {
					// skipUrlUpdate: batchParameterValueUpdate would otherwise
					// remove savedStateId from the URL, which clears selection
					// via the URL listener below before we re-apply it.
					await batchParameterValueUpdate(
						{
							[namespace]: savedStateItem.data.parameters,
						},
						false,
						true,
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

	// Selection follows savedStateId in the URL:
	// - present → select (once the item is loaded)
	// - absent → clear (e.g. after a parameter change removes it)
	// NOTE: If the id is not yet in savedStateIds (infinite scroll), keep
	// waiting until it appears or the list ends. Edge case not fully handled.
	useEffect(() => {
		const parameters = new URLSearchParams(windowLocationSearch);
		const savedStatesIdParam = parameters.get(QUERYPARAM_SAVEDSTATEID);

		if (!savedStatesIdParam) {
			setSelectedValue(null);
			return;
		}

		if (savedStateIds.includes(savedStatesIdParam)) {
			setSelectedValue(savedStatesIdParam);
		}
	}, [windowLocationSearch, savedStateIds]);

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

	// Hidden while loading / empty — no loader flash then disappear.
	if (items.length === 0) {
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
