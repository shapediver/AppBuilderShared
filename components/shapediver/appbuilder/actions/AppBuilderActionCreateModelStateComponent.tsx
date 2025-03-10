import React, {useCallback, useContext, useState} from "react";
import {IAppBuilderActionPropsAddToCart} from "@AppBuilderShared/types/shapediver/appbuilder";
import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";

type Props = IAppBuilderActionPropsAddToCart & {
	namespace: string;
};

/**
 * Functional component for a "createModelState" action.
 *
 * @returns
 */
export default function AppBuilderActionCreateModelStateComponent(
	props: Props,
) {
	const {
		label = "Save configuration",
		icon = IconTypeEnum.DeviceFloppy,
		tooltip,
		namespace,
		includeImage,
		//image, // TODO use image defined by export of href
		includeGltf,
	} = props;
	const notifications = useContext(NotificationContext);

	const {createModelState} = useCreateModelState({namespace});

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);

		const {modelStateId} = await createModelState(
			undefined, // <-- use parameter values of the session
			false, // <-- use parameter values of the session
			includeImage,
			undefined, // <-- custom data
			includeGltf,
		);

		// Save the modelStateId as a search parameter
		if (modelStateId) {
			const url = new URL(window.location.href);
			url.searchParams.set("modelStateId", modelStateId);
			history.replaceState(history.state, "", url.toString());
			notifications.success({
				message: `Model state with ID ${modelStateId} has been saved.`,
			});
		}

		setLoading(false);
	}, [createModelState, includeImage, includeGltf]);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
		/>
	);
}
