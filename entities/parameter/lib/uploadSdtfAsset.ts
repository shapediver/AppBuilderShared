import {IAppBuilderParameterValueSourcePropsSdtf} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	ResAssetDefinition,
	ResStypeParameter,
} from "@shapediver/sdk.geometry-api-sdk-v2";

export type SdtfUploadSession = {
	uploadSDTF: (buffers: ArrayBuffer[]) => Promise<ResAssetDefinition[]>;
};

export type SdtfUploadCache = {
	/**
	 * Download and upload the sdTF at `url` into `uploadNamespace` once.
	 * Concurrent callers with the same key share the in-flight promise.
	 */
	uploadAsset: (options: {
		uploadNamespace: string;
		url: string;
		session: SdtfUploadSession;
		/**
		 * Called only when this request starts a new upload.
		 * Use it to register a single process-manager entry for the shared upload.
		 * `uploadKey` is unique per target session and content URL.
		 */
		onUploadStart?: (
			upload: Promise<string | undefined>,
			uploadKey: string,
		) => void;
	}) => Promise<string | undefined>;
};

/**
 * Build a parameter value from an uploaded asset id and an optional chunk.
 */
export function formatSdtfParameterValue(
	assetId: string,
	chunk?: IAppBuilderParameterValueSourcePropsSdtf["chunk"],
): string {
	const sdtfResponse: ResStypeParameter = {
		asset: {id: assetId},
	};
	if (chunk !== undefined) {
		sdtfResponse.asset!.chunk = chunk;
	}
	return JSON.stringify(sdtfResponse, null, 2);
}

/**
 * Cache for one parameter-value-source resolution.
 * Keyed by target session and content URL so different chunks of the same
 * output share one download and one upload.
 */
/** Collision-free key for one target session and content URL. */
export function sdtfUploadKey(uploadNamespace: string, url: string): string {
	return JSON.stringify([uploadNamespace, url]);
}

export function createSdtfUploadCache(): SdtfUploadCache {
	const uploads = new Map<string, Promise<string | undefined>>();

	return {
		uploadAsset({uploadNamespace, url, session, onUploadStart}) {
			const key = sdtfUploadKey(uploadNamespace, url);
			const existing = uploads.get(key);
			if (existing) return existing;

			const upload = fetch(url)
				.then((response) => response.arrayBuffer())
				.then(async (arrayBuffer) => {
					const uploaded: ResAssetDefinition[] =
						await session.uploadSDTF([arrayBuffer]);
					return uploaded[0]?.id;
				})
				.catch((error) => {
					Logger.warn(
						"Could not resolve sdTF parameter value source.",
						error,
					);
					return undefined;
				});

			uploads.set(key, upload);
			onUploadStart?.(upload, key);
			return upload;
		},
	};
}
