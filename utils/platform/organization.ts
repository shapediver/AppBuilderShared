import {SdPlatformOrganizationMemberRole} from "@shapediver/sdk.platform-api-sdk-v1";

/**
 * Check whether the given user role is "User" or above, i.e. "User", "Manager", "Admin", "Owner
 * @param role
 * @returns
 */
export const roleUserOrAbove = (
	role?: SdPlatformOrganizationMemberRole,
): boolean => {
	return (
		role === SdPlatformOrganizationMemberRole.User ||
		roleManagerOrAbove(role)
	);
};

/**
 * Check whether the given user role is "Manager" or above, i.e. "Manager", "Admin", "Owner
 * @param role
 * @returns
 */
export const roleManagerOrAbove = (
	role?: SdPlatformOrganizationMemberRole,
): boolean => {
	return (
		role === SdPlatformOrganizationMemberRole.Manager ||
		roleAdminOrAbove(role)
	);
};

/**
 * Check whether the given user role is "Admin" or above, i.e. "Admin", "Owner
 * @param role
 * @returns
 */
export const roleAdminOrAbove = (
	role?: SdPlatformOrganizationMemberRole,
): boolean => {
	return (
		role === SdPlatformOrganizationMemberRole.Admin ||
		role === SdPlatformOrganizationMemberRole.Owner
	);
};
