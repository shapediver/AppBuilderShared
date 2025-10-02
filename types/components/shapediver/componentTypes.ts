import {CommonButtonProps} from "@AppBuilderShared/components/shapediver/viewport/buttons/types";

export const PARAMETER_TYPE_STARGATE_DUMMY = "Stargate";

export interface ButtonRenderContext extends CommonButtonProps {
	viewport?: any;
	namespace?: string;
	buttonsDisabled: boolean;
	executing: boolean;
	hasPendingChanges: boolean;
	iconsVisible: boolean;
	fullscreenId: string;
}
