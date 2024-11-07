import React, { useCallback, useContext } from "react";
import { IAppBuilderActionPropsAddToCart } from "../../../../types/shapediver/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";
import { useCreateModelState } from "../../../../hooks/shapediver/useCreateModelState";
import { IconTypeEnum } from "../../../../types/shapediver/icons";
import { NotificationContext } from "../../../../context/NotificationContext";

type Props = IAppBuilderActionPropsAddToCart & {
	namespace: string;
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
		namespace,
		includeImage, 
		//image, // TODO use image defined by export of href
		includeGltf
	} = props;
	const notifications = useContext(NotificationContext);
	
	const { createModelState } = useCreateModelState({ namespace });

	const onClick = useCallback(async () => {
		const modelStateId = await createModelState(
			undefined, // <-- use parameter values of the session
			false, // <-- use parameter values of the session
			includeImage,
			undefined, // <-- custom data
			includeGltf
		);

		// Save the modelStateId as a search parameter
		if (modelStateId) {
			const url = new URL(window.location.href);
			url.searchParams.set("modelStateId", modelStateId);
			history.replaceState(history.state, "", url.toString());
			notifications.success({message: `Model state with ID ${modelStateId} has been saved.`});
		}
		
	}, [createModelState, includeImage, includeGltf]);

	return <AppBuilderActionComponent 
		label={label}
		icon={icon}
		tooltip={tooltip}
		onClick={onClick}
	/>;
}
