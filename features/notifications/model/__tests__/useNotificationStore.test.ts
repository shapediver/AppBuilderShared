/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {NotificationDisplayMode} from "@AppBuilderLib/features/notifications/config/shapediverStoreNotifications";
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

describe("useNotificationStore info", () => {
	beforeEach(() => {
		jest.clearAllMocks();
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
		expect(useNotificationStore.getState().customNotifications).toHaveLength(
			1,
		);

		hide(id!);
		expect(notifications.hide).toHaveBeenCalledWith(id);
		expect(useNotificationStore.getState().customNotifications).toEqual([]);
	});

	it("keeps a provided id and only hides that custom notification", () => {
		const {show, hide} = useNotificationStore.getState();
		show({id: "keep", message: "a", type: "custom"} as never);
		show({id: "drop", message: "b", type: "custom"} as never);
		expect(useNotificationStore.getState().customNotifications).toHaveLength(
			2,
		);

		hide("drop");
		expect(
			useNotificationStore.getState().customNotifications.map((n) => n.id),
		).toEqual(["keep"]);
		expect(notifications.show).toHaveBeenCalledWith(
			expect.objectContaining({id: "keep"}),
		);
	});
});
