/**
 * @jest-environment jsdom
 */
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
});
