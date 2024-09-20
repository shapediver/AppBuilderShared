import React, { useCallback } from "react";
import { IAppBuilderActionPropsAddToCart } from "../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import { useCreateModelState } from "../../../hooks/shapediver/useCreateModelState";
import { IconTypeEnum } from "../../../types/shapediver/icons";

type Props = IAppBuilderActionPropsAddToCart & {
	sessionId: string;
};

/**
 * Functional component for a "createModelState" action.
 *
 * @returns
 */
export default function AppBuilderActionCreateModelStateComponent(props: Props) {
	
	const { 
		label = "Save configuration", 
		icon = IconTypeEnum.DeviceFloppy, 
		tooltip, 
		sessionId,
		includeImage, 
		//image, // TODO use image defined by export of href
		includeGltf
	} = props;
	
	const { createModelState } = useCreateModelState({ sessionId });

	const onClick = useCallback(async () => {
		const modelStateId = await createModelState(
			undefined, // <-- use parameter values of the session
			false, // <-- use parameter values of the session
			includeImage,
			undefined, // <-- custom data
			includeGltf
		);

		// Save the modelStateId as a search parameter
		const url = new URL(window.location.href);
		url.searchParams.set("modelStateId", modelStateId);
		window.history.pushState({modelStateId}, "", url.toString());
		
	}, [createModelState, includeImage, includeGltf]);

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
		onClick={onClick}
	/>;
}
