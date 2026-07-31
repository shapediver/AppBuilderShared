import {
	getDefaultPlatformUrl,
	getPlatformClientId,
	shouldUsePlatform,
} from "@AppBuilderLib/shared/lib/platform/environment";
import useAsync from "@AppBuilderLib/shared/lib/useAsync";
import {
	create as createSdk,
	SdPlatformQueryResponse,
	SdPlatformResponseSavedStatePublic,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverStorePlatformSavedStates} from "./useShapeDiverStorePlatformSavedStates";

// Fetch the saved states of a model via the iframe-embedding endpoint.
// Used off-platform, where the saved_states/query API is not CORS-enabled and
// the store has no platform client. iframeEmbedding is public and CORS-enabled.
async function loadFromIframe(
	slug: string,
	platformUrl?: string,
): Promise<SdPlatformResponseSavedStatePublic[]> {
	const client = createSdk({
		clientId: getPlatformClientId(),
		baseUrl: platformUrl ?? getDefaultPlatformUrl(),
	});
	const result = await client.models.iframeEmbedding(slug, {
		saved_states: true,
	});
	return (
		(result.data?.model?.saved_states as
			| SdPlatformResponseSavedStatePublic[]
			| undefined) ?? []
	);
}

export default function useQuerySavedState(
	savedStateId: string | null,
	slug?: string,
	platformUrl?: string,
) {
	const [initialSavedState, setInitialSavedState] = useState<{
		status: "loading" | "success" | "error";
		data: SdPlatformResponseSavedStatePublic | undefined;
	}>({status: savedStateId ? "loading" : "success", data: undefined});

	const {useQuery, addItem} = useShapeDiverStorePlatformSavedStates(
		useShallow((state) => ({
			useQuery: state.useQuery,
			addItem: state.addItem,
		})),
	);

	const {
		items: savedStateIds,
		loadMore: loadSavedState,
		loading: savedStateLoading,
	} = useQuery(
		savedStateId
			? {
					queryParams: {
						filters: {
							"id[=]": savedStateId,
						},
						limit: 1,
					},
				}
			: {
					queryParams: {
						limit: 0,
					},
				},
	);

	// Resolve the initial saved state by its id.
	//
	// Platform path: use the store's query (loadMore), which authenticates with
	// redirect=false so public saved states work without a login redirect.
	//
	// Off-platform path: the store has no platform client (authenticate returns
	// undefined) and session resolution is blocked while this hook is "loading",
	// which deadlocks the iframe-embedding flow that would otherwise seed saved
	// states into the store. The saved_states/query API is not CORS-enabled for
	// arbitrary origins, so use the iframe-embedding endpoint (which is) with the
	// model slug to fetch the saved state and seed the store.
	useAsync(
		async () => {
			if (initialSavedState.status !== "loading") return;
			if (!savedStateId) return;

			if (shouldUsePlatform()) {
				if (savedStateIds.length === 0 && !savedStateLoading) {
					return loadSavedState() as Promise<
						| SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>
						| Error
						| undefined
					>;
				}
				return;
			}

			if (!slug) {
				setInitialSavedState({status: "error", data: undefined});
				return;
			}
			const savedStates = await loadFromIframe(slug, platformUrl);
			return {
				success: true,
				data: {result: savedStates},
			} as SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>;
		},
		[
			savedStateId,
			slug,
			platformUrl,
			savedStateIds.length,
			savedStateLoading,
			initialSavedState,
		],
		{
			onSuccess: (
				response:
					| SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>
					| Error
					| undefined,
			) => {
				if (response instanceof Error) {
					setInitialSavedState({status: "error", data: undefined});
					return;
				}
				if (!response) return;

				const {
					success,
					data: {result},
				} = response;
				if (!success || !result) return;
				const found = result.find((s) => s.id === savedStateId);
				if (found) {
					addItem(found);
					setInitialSavedState({status: "success", data: found});
				} else {
					setInitialSavedState({status: "error", data: undefined});
				}
			},
			onError: () => {
				setInitialSavedState({status: "error", data: undefined});
			},
		},
	);

	return {initialSavedState};
}
