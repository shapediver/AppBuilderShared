import Icon from "@AppBuilderShared/components/ui/Icon";
import ToggleIcon from "@AppBuilderShared/components/ui/ToggleIcon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {TModelItem} from "@AppBuilderShared/types/store/shapediverStorePlatformModels";
import {
	SdPlatformModelVisibility,
	SdPlatformResponseModelPublic,
} from "@shapediver/sdk.platform-api-sdk-v1";
import React, {useMemo} from "react";

interface Props {
	/** Model to be displayed */
	item: TModelItem;
	/** If true, show the model's organization confirmation status. Defaults to false. */
	showConfirmationStatus?: boolean;
	/** If true, allow updating the model's organization confirmation status. Defaults to false. */
	enableConfirmationStatusUpdate?: boolean;
	/** Class name to apply */
	className?: string;
}

const createStatusDescription = (
	icon: IconTypeEnum,
	status: Status,
	description: string,
) => ({icon, status, description});

enum Status {
	Private = "private",
	Organization = "organization",
	OrganizationPending = "organization_pending",
	OrganizationConfirmed = "organization_confirmed",
	Public = "public",
}

const IconTypeOrganizationPending = IconTypeEnum.UserQuestion;
const IconTypeOrganizationConfirmed = IconTypeEnum.UserCheck;

const StatusDescriptionMap = {
	[Status.Private]: createStatusDescription(
		IconTypeEnum.LockSquare,
		Status.Private,
		"Private",
	),
	[Status.Organization]: createStatusDescription(
		IconTypeEnum.UsersGroup,
		Status.Organization,
		"Visible to organization",
	),
	[Status.OrganizationPending]: createStatusDescription(
		IconTypeOrganizationPending,
		Status.OrganizationPending,
		"Pending confirmation",
	),
	[Status.OrganizationConfirmed]: createStatusDescription(
		IconTypeOrganizationConfirmed,
		Status.OrganizationConfirmed,
		"Visible to organization",
	),
	[Status.Public]: createStatusDescription(
		IconTypeEnum.World,
		Status.Public,
		"Public",
	),
};

const getStatusDescription = (
	model: SdPlatformResponseModelPublic,
	showConfirmationStatus?: boolean,
) => {
	if (model.visibility === SdPlatformModelVisibility.Private)
		return StatusDescriptionMap["private"];
	else if (model.visibility === SdPlatformModelVisibility.Public)
		return StatusDescriptionMap["public"];
	else if (model.visibility === SdPlatformModelVisibility.Organization) {
		if (showConfirmationStatus) {
			if (model.organization_settings?.confirmed)
				return StatusDescriptionMap["organization_confirmed"];
			else return StatusDescriptionMap["organization_pending"];
		}

		return StatusDescriptionMap["organization"];
	}
};

export default function ModelStatusIcon(props: Props) {
	const {
		showConfirmationStatus = false,
		enableConfirmationStatusUpdate = false,
		className,
		item: {data: model, actions},
	} = props;

	const statusDescription = useMemo(
		() => getStatusDescription(model, showConfirmationStatus),
		[model, showConfirmationStatus],
	);
	const confirmationStatusUpdateEnabled = useMemo(
		() =>
			enableConfirmationStatusUpdate &&
			statusDescription &&
			(statusDescription.status === Status.OrganizationPending ||
				statusDescription.status === Status.OrganizationConfirmed),
		[enableConfirmationStatusUpdate, statusDescription],
	);

	return confirmationStatusUpdateEnabled ? (
		<ToggleIcon
			value={model.organization_settings?.confirmed ?? false}
			iconActive={IconTypeOrganizationConfirmed}
			iconInactive={IconTypeOrganizationPending}
			onActivate={actions.confirmForOrganization}
			onDeactivate={actions.revokeForOrganization}
			tooltipActive="Revoke model"
			tooltipInactive="Confirm model"
		/>
	) : statusDescription ? (
		<TooltipWrapper label={statusDescription.description}>
			<Icon type={statusDescription.icon} className={className} />
		</TooltipWrapper>
	) : null;
}
