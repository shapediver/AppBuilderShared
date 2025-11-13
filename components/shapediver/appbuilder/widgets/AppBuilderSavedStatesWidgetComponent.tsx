import SelectComponent from "@AppBuilderShared/components/shapediver/parameter/select/SelectComponent";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStorePlatformSavedStates} from "@AppBuilderShared/store/useShapeDiverStorePlatformSavedStates";
import {
	IAppBuilderWidgetPropsSavedStates,
	ISelectComponentItemDataType,
	SelectComponentType,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {TSavedStateQueryProps} from "@AppBuilderShared/types/store/shapediverStorePlatformSavedStates";
import {
	Alert,
	Flex,
	Loader,
	MantineStyleProp,
	Paper,
	PaperProps,
	Stack,
	useProps,
} from "@mantine/core";
import React, {useContext, useEffect, useMemo, useState} from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import {useShallow} from "zustand/react/shallow";

type StyleProps = PaperProps;

const defaultStyleProps: Partial<StyleProps> = {
	p: "md",
};

type AppBuilderSavedStatesWidgetThemePropsType = Partial<StyleProps>;

type Props = IAppBuilderWidgetPropsSavedStates &
	AppBuilderSavedStatesWidgetThemePropsType &
	TSavedStateQueryProps & {
		namespace?: string;
		selectType?: SelectComponentType;
	};

export default function AppBuilderSavedStatesWidgetComponent(props: Props) {
	const {
		namespace,
		selectType = "fullwidthcards",
		queryParams,
		filterByUser,
		filterByOrganization,
		filterByModel,
		cacheKey,
		...rest
	} = props;

	const themeProps = useProps(
		"AppBuilderSavedStatesWidgetComponent",
		defaultStyleProps,
		rest,
	);

	const context = useContext(AppBuilderContainerContext);

	const {
		useQuery,
		items: savedStateItems,
		selectedSavedStateId,
		setSelectedSavedStateId,
		setIsExecuting,
	} = useShapeDiverStorePlatformSavedStates(
		useShallow((state) => ({
			useQuery: state.useQuery,
			items: state.items,
			selectedSavedStateId: state.selectedSavedStateId,
			setSelectedSavedStateId: state.setSelectedSavedStateId,
			setIsExecuting: state.setIsExecuting,
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

	// Sync selectedValue with store changes
	useEffect(() => {
		if (namespace) {
			const storeValue = selectedSavedStateId[namespace];
			setSelectedValue(storeValue ?? null);
		}
	}, [namespace, selectedSavedStateId]);

	const handleChange = async (value: string | null) => {
		if (namespace && value) {
			// Set selected saved state ID
			setSelectedSavedStateId(namespace, value);

			// Apply saved state parameters
			const savedStateItem = savedStateItems[value];
			if (savedStateItem?.data?.parameters) {
				try {
					// Set isExecuting flag to prevent clearing selection during parameter changes
					setIsExecuting(namespace, true);

					await batchParameterValueUpdate(
						{
							[namespace]: savedStateItem.data.parameters,
						},
						false,
					);
				} catch (error) {
					console.error("Failed to apply saved state:", error);
				} finally {
					// Clear isExecuting flag after parameters are applied
					setIsExecuting(namespace, false);
				}
			}
		} else if (namespace) {
			setSelectedSavedStateId(namespace, undefined);
		}
	};

	if (error) {
		return (
			<Paper {...themeProps} style={styleProps}>
				<Alert title="Error">{error.message}</Alert>
			</Paper>
		);
	}

	if (items.length === 0 && !hasNextPage) {
		return null;
	}

	return (
		<Paper {...themeProps} style={styleProps}>
			<Stack gap="md">
				<SelectComponent
					type={selectType}
					value={selectedValue}
					onChange={handleChange}
					items={items}
					itemData={itemData}
				/>
				{(loading || hasNextPage) && (
					<Flex justify="center" align="center">
						<Loader ref={sentryRef} />
					</Flex>
				)}
			</Stack>
		</Paper>
	);
}
