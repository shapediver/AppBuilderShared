import {PropsParameter} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {useParameterChanges} from "@AppBuilderLib/entities/parameter/model/useParameterChanges";
import {
	isParamDefinition,
	useSortedParametersAndExports,
} from "@AppBuilderLib/entities/parameter/model/useSortedParametersAndExports";
import {Icon} from "@AppBuilderLib/shared/ui/icon";
import {Button, Group, Text} from "@mantine/core";
import React from "react";

interface Props {
	parameters?: PropsParameter[];
}

export default function AcceptRejectButtons({parameters}: Props) {
	// check if there are parameter changes to be confirmed
	const parameterChanges = useParameterChanges(parameters ?? []);

	// check if there is at least one parameter for which changes can be accepted or rejected
	const sortedParamsAndExports = useSortedParametersAndExports(parameters);
	const showButtons = sortedParamsAndExports.some(
		(p) => isParamDefinition(p) && p.parameter.acceptRejectMode,
	);

	// disable the accept and reject buttons if there are no changes or
	// if there are changes that are currently being executed
	const disableChangeControls =
		parameterChanges.length === 0 ||
		parameterChanges.some((c) => c.executing);
	const acceptChanges = async () => {
		for (let index = 0; index < parameterChanges.length; index++) {
			await parameterChanges[index].accept();
		}
	};
	const rejectChanges = () => {
		parameterChanges.forEach((c) => c.reject());
	};

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
					variant="light"
				>
					<Text size="md">Accept</Text>
				</Button>
				<Button
					fullWidth={true}
					leftSection={<Icon iconType={"tabler:x"} />}
					onClick={rejectChanges}
					disabled={disableChangeControls}
					variant="light"
				>
					<Text size="md">Reject</Text>
				</Button>
			</Group>
		</>
	);
}
