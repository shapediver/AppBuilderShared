import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

export type HostedAgentFrameStore = {
	frame: Window | null;
	setFrame: (frame: Window) => void;
	/** Clears only when `frame` is still the registered window. */
	clearFrame: (frame: Window | null) => void;
};

/**
 * The placed or floating `hostedAgent` widget publishes its iframe window here.
 * The host reads it for ToolsApi; it does not hook the widget tree.
 */
export const useHostedAgentFrameStore = create<HostedAgentFrameStore>()(
	devtools(
		(set, get) => ({
			frame: null,
			setFrame: (frame) => set({frame}, false, "setFrame"),
			clearFrame: (frame) => {
				if (!frame || get().frame !== frame) {
					return;
				}
				set({frame: null}, false, "clearFrame");
			},
		}),
		{...devtoolsSettings, name: "hostedAgentFrame"},
	),
);
