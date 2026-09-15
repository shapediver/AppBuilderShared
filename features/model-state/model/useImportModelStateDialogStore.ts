import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

type ImportModelStateDialogRequest = {
	namespace: string;
	resolve: () => void;
};

type ImportModelStateDialogStore = {
	current: ImportModelStateDialogRequest | null;
	queue: ImportModelStateDialogRequest[];
	open: (namespace: string) => Promise<void>;
	close: () => void;
};

/**
 * Promise-based import-model-state dialog. `open` resolves when the user
 * confirms or cancels, so executeActions can wait for input.
 */
export const useImportModelStateDialogStore =
	create<ImportModelStateDialogStore>()(
		devtools(
			(set, get) => ({
				current: null,
				queue: [],
				open: (namespace) =>
					new Promise<void>((resolve) => {
						const request: ImportModelStateDialogRequest = {
							namespace,
							resolve,
						};
						if (!get().current) {
							set({current: request}, false, "open");
							return;
						}
						set(
							{queue: [...get().queue, request]},
							false,
							"enqueue",
						);
					}),
				close: () => {
					const {current, queue} = get();
					current?.resolve();
					const [next, ...rest] = queue;
					set({current: next ?? null, queue: rest}, false, "close");
				},
			}),
			{
				...devtoolsSettings,
				name: "ShapeDiver | ImportModelStateDialog",
			},
		),
	);
