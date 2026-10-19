import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

export type AppBuilderActionArQrPayload = {
	arLink?: string;
	error?: string;
};

type AppBuilderActionArQrStore = {
	opened: boolean;
	arLink: string;
	error: string;
	resolve: (() => void) | undefined;
	open: (payload: AppBuilderActionArQrPayload) => Promise<void>;
	close: () => void;
};

/**
 * Promise-based AR QR modal. Host-registered AR `run` opens this when the
 * viewport is not `viewableInAR()`. Resolves when the user closes the modal.
 */
export const useAppBuilderActionArQrStore = create<AppBuilderActionArQrStore>()(
	devtools(
		(set, get) => ({
			opened: false,
			arLink: "",
			error: "",
			resolve: undefined,
			open: ({arLink = "", error = ""}) =>
				new Promise<void>((resolve) => {
					get().resolve?.();
					set({opened: true, arLink, error, resolve}, false, "open");
				}),
			close: () => {
				get().resolve?.();
				set(
					{
						opened: false,
						arLink: "",
						error: "",
						resolve: undefined,
					},
					false,
					"close",
				);
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | AppBuilderActionArQr"},
	),
);
