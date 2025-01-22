import React from "react";
import { Alert, Loader, SimpleGrid } from "@mantine/core";
import ModelCard, { IModelCardProps } from "@AppBuilderShared/components/shapediver/platform/ModelCard";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { useShallow } from "zustand/react/shallow";
import { useShapeDiverStorePlatformModels } from "@AppBuilderShared/store/useShapeDiverStorePlatformModels";
import { TModelQueryProps } from "@AppBuilderShared/types/store/shapediverStorePlatformModels";

export interface IModelLibraryProps extends TModelQueryProps {
	/**
	 * Base URL for model view pages
	 */
	modelViewBaseUrl: string,
	/**
	 * Properties of the model cards
	 */
	modelCardProps?: IModelCardProps,
}

export default function ModelLibrary(props: IModelLibraryProps) {

	const { modelViewBaseUrl, modelCardProps, ...rest } = props;
	const { useQuery, items: modelStore } = useShapeDiverStorePlatformModels(
		useShallow(state => ({useQuery: state.useQuery, items: state.items}))
	);
	const { loading, error, items, hasMore: hasNextPage, loadMore } = useQuery(rest);

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
		// We can use it to trigger 'onLoadMore' when the sentry comes near to become
		// visible, instead of becoming fully visible on the screen.
		rootMargin: "0px 0px 400px 0px",
	});

	const modelItems = items.map(id => modelStore[id]).filter(item => item !== undefined);

	return (
		error ? <Alert title="Error">{error.message}</Alert> :
			items.length === 0 && !hasNextPage ? <Alert>No models found.</Alert> :
				<SimpleGrid cols={3}>
					{modelItems.map((item, index) => (
						<ModelCard
							key={index}
							item={item}
							href={`${modelViewBaseUrl.endsWith("/") ? modelViewBaseUrl : `${modelViewBaseUrl}/`}?slug=${item.data.slug}`}
							target="_blank"
							{...modelCardProps}
						/>
					))}
					{(loading || hasNextPage) && <Loader ref={sentryRef}/>}
				</SimpleGrid>
	);
}
