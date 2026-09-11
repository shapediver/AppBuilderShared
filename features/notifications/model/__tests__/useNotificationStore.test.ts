/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {NotificationDisplayMode} from "@AppBuilderLib/features/notifications/config/shapediverStoreNotifications";
import {
	getEnvironmentIdentifier,
	isRunningInPlatform,
} from "@AppBuilderLib/shared/lib/platform/environment";
import {notifications} from "@mantine/notifications";
import {
	getNotificationActions,
	useNotificationStore,
} from "../useNotificationStore";

jest.mock("@mantine/notifications", () => ({
	notifications: {
		show: jest.fn(),
		hide: jest.fn(),
		update: jest.fn(),
	},
}));

jest.mock("@AppBuilderLib/shared/lib/platform/environment", () => ({
	getEnvironmentIdentifier: jest.fn(() => "localhost"),
	isRunningInPlatform: jest.fn(() => false),
}));

const mockedGetEnvironmentIdentifier =
	getEnvironmentIdentifier as jest.MockedFunction<
		typeof getEnvironmentIdentifier
	>;
const mockedIsRunningInPlatform = isRunningInPlatform as jest.MockedFunction<
	typeof isRunningInPlatform
>;

describe("useNotificationStore info", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetEnvironmentIdentifier.mockReturnValue("localhost");
		mockedIsRunningInPlatform.mockReturnValue(false);
	});

	it("shows a notification using infoColor", () => {
		const {setStyleProps, info} = useNotificationStore.getState();
		setStyleProps({infoColor: "blue"});
		info({message: "hello"});

		expect(notifications.show).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "hello",
				color: "blue",
			}),
		);
	});

	it("exposes info on getNotificationActions", () => {
		expect(typeof getNotificationActions().info).toBe("function");
	});

	it("maps error warning and success to style colors", () => {
		const {setStyleProps, error, warning, success} =
			useNotificationStore.getState();
		setStyleProps({
			errorColor: "red",
			warningColor: "yellow",
			successColor: "green",
		});

		error({message: "e"});
		warning({message: "w"});
		success({message: "s"});

		expect(notifications.show).toHaveBeenCalledWith(
			expect.objectContaining({message: "e", color: "red"}),
		);
		expect(notifications.show).toHaveBeenCalledWith(
			expect.objectContaining({message: "w", color: "yellow"}),
		);
		expect(notifications.show).toHaveBeenCalledWith(
			expect.objectContaining({message: "s", color: "green"}),
		);
	});

	it("skips show and update when displayMode is none", () => {
		const {show, update} = useNotificationStore.getState();
		expect(
			show({
				message: "hidden",
				displayMode: NotificationDisplayMode.NONE,
			}),
		).toBeUndefined();
		update({
			id: "n1",
			message: "hidden",
			displayMode: NotificationDisplayMode.NONE,
		});
		expect(notifications.show).not.toHaveBeenCalled();
		expect(notifications.update).not.toHaveBeenCalled();
	});

	it("hides mantine notifications and drops matching custom entries", () => {
		const {show, hide} = useNotificationStore.getState();
		const id = show({message: "plain", type: "custom"} as never);
		expect(id).toBeDefined();
		expect(
			useNotificationStore.getState().customNotifications,
		).toHaveLength(1);

		hide(id!);
		expect(notifications.hide).toHaveBeenCalledWith(id);
		expect(useNotificationStore.getState().customNotifications).toEqual([]);
	});

	it("keeps a provided id and only hides that custom notification", () => {
		const {show, hide} = useNotificationStore.getState();
		show({id: "keep", message: "a", type: "custom"} as never);
		show({id: "drop", message: "b", type: "custom"} as never);
		expect(
			useNotificationStore.getState().customNotifications,
		).toHaveLength(2);

		hide("drop");
		expect(
			useNotificationStore
				.getState()
				.customNotifications.map((n) => n.id),
		).toEqual(["keep"]);
		expect(notifications.show).toHaveBeenCalledWith(
			expect.objectContaining({id: "keep"}),
		);
	});

	it("assigns distinct ids to two rapid shows", () => {
		const {show} = useNotificationStore.getState();
		const first = show({message: "first"});
		const second = show({message: "second"});

		expect(first).toEqual(expect.any(String));
		expect(second).toEqual(expect.any(String));
		expect(first).not.toBe(second);
	});

	it("shows when displayMode is all", () => {
		const {show} = useNotificationStore.getState();
		expect(
			show({
				message: "everywhere",
				displayMode: NotificationDisplayMode.ALL,
			}),
		).toEqual(expect.any(String));
		expect(notifications.show).toHaveBeenCalled();
	});

	it("shows PLATFORM notifications only in the platform", () => {
		const {show} = useNotificationStore.getState();

		expect(
			show({
				message: "platform",
				displayMode: NotificationDisplayMode.PLATFORM,
			}),
		).toBeUndefined();
		expect(notifications.show).not.toHaveBeenCalled();

		mockedIsRunningInPlatform.mockReturnValue(true);
		expect(
			show({
				message: "platform",
				displayMode: NotificationDisplayMode.PLATFORM,
			}),
		).toEqual(expect.any(String));
		expect(notifications.show).toHaveBeenCalled();
	});

	it("shows IFRAME notifications only in an iframe environment", () => {
		const {show} = useNotificationStore.getState();

		expect(
			show({
				message: "iframe",
				displayMode: NotificationDisplayMode.IFRAME,
			}),
		).toBeUndefined();
		expect(notifications.show).not.toHaveBeenCalled();

		mockedGetEnvironmentIdentifier.mockReturnValue("iframe");
		expect(
			show({
				message: "iframe",
				displayMode: NotificationDisplayMode.IFRAME,
			}),
		).toEqual(expect.any(String));
		expect(notifications.show).toHaveBeenCalled();
	});
});
