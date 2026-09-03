import {viewportScreenshotPropsSchema} from "@AppBuilderLib/entities/viewport/config/viewportScreenshotProps.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";
import type {
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
} from "@shapediver/viewer.shared.types";
import {createModelStateDataSchema} from "./createModelState.zod";

type ScreenshotPropsFromZod = z.infer<typeof viewportScreenshotPropsSchema>;

/**
 * Data accepted by the useCreateModelState hook to create a model state.
 *
 * Zod validates `screenshotProps.camera` as a name/type lookup union for settings
 * JSON. Runtime callers use the broader camera shape from
 * {@link OrthographicCameraProperties} / {@link PerspectiveCameraProperties};
 * only `camera` is widened here so the rest of the bag stays Zod-inferred.
 */
export type ICreateModelStateData = Omit<
	z.infer<typeof createModelStateDataSchema>,
	"screenshotProps"
> & {
	screenshotProps?: Omit<ScreenshotPropsFromZod, "camera"> & {
		camera?:
			| Partial<OrthographicCameraProperties>
			| Partial<PerspectiveCameraProperties>;
	};
};

/**
 * Data returned from the useCreateModelState hook.
 */
export interface ICreateModelStateResult {
	/** Id of created model state. */
	modelStateId?: string;
	/** Data URL of the created screenshot or href to a specified image (either via export or directly) */
	screenshot?: string;
	/** Model view URL of the Geometry Backend system the model state was created on. */
	modelViewUrl?: string;
	/** URL of the image saved as part of the model state. */
	modelStateImageUrl?: string;
	/** URL of the glTF asset saved as part of the model state. */
	modelStateGltfUrl?: string;
	/** URL of the usdz asset saved as part of the model state. */
	modelStateUsdzUrl?: string;
}
