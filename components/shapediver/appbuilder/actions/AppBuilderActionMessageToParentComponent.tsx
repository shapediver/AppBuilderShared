import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {IAppBuilderLegacyActionPropsMessageToParent} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback, useState} from "react";
import {useNotificationStore} from "~/shared/store/useNotificationStore";

/**
 * Functional component for an "messageToParent" action.
 *
 * @returns
 */
export default function AppBuilderActionMessageToParentComponent(
	props: IAppBuilderLegacyActionPropsMessageToParent,
) {
	const {
		label = "Message to parent",
		icon = "tabler:message-2-code",
		tooltip,
		type,
		data,
	} = props;

	const notifications = useNotificationStore();

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);
		// in case we are not running inside an iframe, the instance of
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;

		try {
			const result = await api.messageToParent({
				type,
				data,
			});
			if (result.notification) {
				const {type, data} = result.notification;
				if (type === "error") {
					notifications.error(data);
				} else if (type === "warning") {
					notifications.warning(data);
				} else if (type === "success") {
					notifications.success(data);
				} else {
					notifications.show(data);
				}
			}
		} catch (e) {
			notifications.error({
				message: `An error happened while sending message ${type} to the parent page.`,
			});
			throw e;
		} finally {
			setLoading(false);
		}
	}, [type, data]);

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
