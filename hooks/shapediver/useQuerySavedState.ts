import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {useShapeDiverStorePlatformSavedStates} from "@AppBuilderShared/store/useShapeDiverStorePlatformSavedStates";
import {IAppBuilderSettingsSession} from "@AppBuilderShared/types/shapediver/appbuilder";
import {getDefaultPlatformUrl} from "@AppBuilderShared/utils/platform/environment";
import {
	SdPlatformQueryResponse,
	SdPlatformResponseSavedStatePublic,
} from "@shapediver/sdk.platform-api-sdk-v1";
import {useEffect, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import useAsync from "~/shared/hooks/misc/useAsync";

export default function useQuerySavedState(
	savedStateId: string | null,
	options?: {
		slug?: string | null;
		platformUrl?: string | null;
		ticket?: string | null;
		modelViewUrl?: string | null;
		modelStateId?: string;
	},
) {
	const [initialSavedState, setInitialSavedState] = useState<{
		status: "loading" | "success" | "error";
		data: SdPlatformResponseSavedStatePublic | undefined;
	}>({status: savedStateId ? "loading" : "success", data: undefined});

	const {useQuery} = useShapeDiverStorePlatformSavedStates(
		useShallow((state) => ({
			useQuery: state.useQuery,
			items: state.items,
		})),
	);

	const {clientRef} = useShapeDiverStorePlatform(
		useShallow((state) => ({
			clientRef: state.clientRef,
		})),
	);
	const [clientInitialized, setClientInitialized] =
		useState<boolean>(!!clientRef);
	useEffect(() => {
		setClientInitialized(!!clientRef);
	}, [clientRef]);

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

	useAsync(
		async () => {
			if (initialSavedState.status !== "loading") return;

			if (
				savedStateId &&
				savedStateIds.length === 0 &&
				!savedStateLoading
			) {
				return loadSavedState() as Promise<
					| SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>
					| Error
					| undefined
				>;
			}
		},
		[savedStateId, savedStateLoading, initialSavedState, clientInitialized],
		{
			onSuccess: (
				response:
					| SdPlatformQueryResponse<SdPlatformResponseSavedStatePublic>
					| Error
					| undefined,
			) => {
				if (!response || response instanceof Error) return;

				const {
					success,
					data: {result},
				} = response;
				if (success && result && result.length > 0) {
					setInitialSavedState({
						status: "success",
						data: result[0],
					});
				} else {
					setInitialSavedState({
						status: "error",
						data: undefined,
					});
				}
			},
		},
	);

	// define fallback session settings to be used in case loading from json failed
	// in case slug and optionally platformUrl are defined, use them
	// otherwise, if ticket and modelViewUrl are defined, use them
	const queryParamSession = useMemo<
		IAppBuilderSettingsSession | undefined
	>(() => {
		if (!options) return undefined;

		const {slug, platformUrl, ticket, modelViewUrl, modelStateId} = options;
		const initialParameterValues =
			initialSavedState.status === "success" &&
			initialSavedState.data?.parameters
				? initialSavedState.data.parameters
				: undefined;

		return slug
			? ({
					id: "default",
					slug,
					platformUrl: platformUrl ?? getDefaultPlatformUrl(),
					modelStateId,
					initialParameterValues,
				} as IAppBuilderSettingsSession)
			: ticket && modelViewUrl
				? {
						id: "default",
						ticket,
						modelViewUrl,
						modelStateId,
						initialParameterValues,
					}
				: undefined;
	}, [
		options?.slug,
		options?.platformUrl,
		options?.ticket,
		options?.modelViewUrl,
		options?.modelStateId,
		initialSavedState,
	]);

	return {initialSavedState, queryParamSession};
}
