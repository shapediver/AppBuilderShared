import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {Button, Group, Text} from "@mantine/core";
import {useMemo, useSyncExternalStore} from "react";
import {PropsParameter} from "../config/propsParameter";
import {
	acceptGlobalParameterChanges,
	acceptQueuedParameterIds,
	getInlineAcceptRejectEpoch,
	globalPendingParameterIds,
	rejectGlobalParameterChanges,
	rejectQueuedParameterIds,
	subscribeInlineAcceptReject,
} from "../lib/globalAcceptReject";
import {useParameterChanges} from "../model/useParameterChanges";
import {
	isParamDefinition,
	useSortedParametersAndExports,
} from "../model/useSortedParametersAndExports";

interface Props {
	parameters?: PropsParameter[];
	/**
	 * "global" is the shared group and skips parameters presented inline.
	 * "inline" is the historical parameter-list control for parameters that
	 * opt into `acceptRejectModePresentation: "inline"`.
	 */
	scope?: "global" | "inline";
}

export default function AcceptRejectButtons({
	parameters,
	scope = "global",
}: Props) {
	// check if there are parameter changes to be confirmed
	const parameterChanges = useParameterChanges(parameters ?? []);

	// check if there is at least one parameter for which changes can be accepted or rejected
	const sortedParamsAndExports = useSortedParametersAndExports(parameters);
	const inlineEpoch = useSyncExternalStore(
		subscribeInlineAcceptReject,
		getInlineAcceptRejectEpoch,
		getInlineAcceptRejectEpoch,
	);
	const scopedParameters = sortedParamsAndExports.flatMap((item) => {
		if (!isParamDefinition(item) || !item.parameter.acceptRejectMode)
			return [];
		const presentation =
			item.parameter.acceptRejectModePresentation ?? "global";
		if (
			scope === "inline"
				? presentation !== "inline"
				: presentation === "inline"
		)
			return [];

		return [
			{
				namespace: item.parameter.namespace,
				parameterId: item.definition.id,
			},
		];
	});
	// disable the accept and reject buttons if there are no shared changes or
	// if there are changes that are currently being executed
	const hasScopedChanges = useMemo(
		() =>
			scope === "inline"
				? parameterChanges.some((entry) =>
						scopedParameters.some(
							(parameter) =>
								parameter.namespace === entry.namespace &&
								parameter.parameterId in entry.changes.values,
						),
					)
				: parameterChanges.some(
						(entry) =>
							globalPendingParameterIds(
								entry.namespace,
								entry.changes.values,
							).length > 0,
					),
		[inlineEpoch, parameterChanges, scope, scopedParameters],
	);
	// Inline buttons belong to one parameter and stay hidden until that
	// parameter has a queued change. The shared group stays mounted whenever
	// a parameter uses global accept/reject, and is only disabled while idle.
	const showButtons =
		scope === "inline" ? hasScopedChanges : scopedParameters.length > 0;
	const disableChangeControls =
		!hasScopedChanges ||
		parameterChanges.some((entry) => entry.changes.executing);
	const acceptChanges = async () => {
		if (scope === "inline") {
			await acceptQueuedParameterIds(parameterChanges, scopedParameters);
			return;
		}
		await acceptGlobalParameterChanges(parameterChanges);
	};
	const rejectChanges = () => {
		if (scope === "inline") {
			rejectQueuedParameterIds(parameterChanges, scopedParameters);
			return;
		}
		rejectGlobalParameterChanges(parameterChanges);
	};

	// Inline buttons sit on the parameter surface, where the light tint
	// disappears. A solid fill keeps them readable there. The shared group
	// stays on the historical light variant.
	const buttonVariant = scope === "inline" ? "filled" : "light";

	return !showButtons ? (
		<></>
	) : (
		<>
			<Group
				key="acceptOrReject"
				justify="space-between"
				w="100%"
				wrap="nowrap"
			>
				<Button
					fullWidth={true}
					leftSection={<Icon iconType={"tabler:check"} />}
					onClick={acceptChanges}
					disabled={disableChangeControls}
					variant={buttonVariant}
				>
					<Text size="md" c="inherit">
						Accept
					</Text>
				</Button>
				<Button
					fullWidth={true}
					leftSection={<Icon iconType={"tabler:x"} />}
					onClick={rejectChanges}
					disabled={disableChangeControls}
					variant={buttonVariant}
				>
					<Text size="md" c="inherit">
						Reject
					</Text>
				</Button>
			</Group>
		</>
	);
}
