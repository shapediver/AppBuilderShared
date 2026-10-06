/**
 * @jest-environment jsdom
 */
import {TrackerContext} from "@AppBuilderLib/shared/lib/TrackerContext";
import {type ITrackerContext} from "@AppBuilderLib/shared/lib/TrackerContext.types";
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import NetPromoterScore, {
	type NetPromoterScoreStyleProps,
} from "../NetPromoterScore";
import {NPS_STORAGE_KEY, readNpsStorage} from "../npsSurveyStorage";

const NPS_DEFAULT_QUESTION =
	"How likely are you to recommend this App to other members of your organization?";

function createTracker(): ITrackerContext & {
	trackEvent: jest.Mock;
	trackMetric: jest.Mock;
} {
	return {
		trackPageview: jest.fn(),
		trackEvent: jest.fn(),
		trackMetric: jest.fn(),
		delayedPropsAwaiter: {
			requiredDelayedProps: [],
			delayedProps: {},
			setDelayedProps: jest.fn(),
			requiredPropsAvailable: Promise.resolve(true),
		},
	};
}

function renderPrompt(
	props: Partial<NetPromoterScoreStyleProps> = {},
	tracker = createTracker(),
) {
	return {
		tracker,
		...render(
			<TrackerContext.Provider value={tracker}>
				<MantineProvider>
					<NetPromoterScore openDelay={0} {...props} />
				</MantineProvider>
			</TrackerContext.Provider>,
		),
	};
}

describe("NetPromoterScore", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("opens with the default question when message is absent", async () => {
		renderPrompt();
		expect(
			await screen.findByText(NPS_DEFAULT_QUESTION),
		).toBeInTheDocument();
	});

	it("shows no question text when message is an empty string", async () => {
		renderPrompt({message: ""});
		await screen.findByRole("button", {name: "0"});
		expect(
			screen.queryByText(NPS_DEFAULT_QUESTION),
		).not.toBeInTheDocument();
		expect(document.querySelector(".question")).not.toBeInTheDocument();
	});

	it("opens with a custom message when provided", async () => {
		renderPrompt({message: "Custom NPS question?"});
		expect(
			await screen.findByText("Custom NPS question?"),
		).toBeInTheDocument();
	});

	it("reports a score, stores answered, and closes on digit click", async () => {
		const {tracker} = renderPrompt();
		fireEvent.click(await screen.findByRole("button", {name: "7"}));
		expect(tracker.trackMetric).toHaveBeenCalledWith(
			"Net Promoter Score",
			"Net Promoter Score",
			7,
		);
		expect(tracker.trackEvent).not.toHaveBeenCalled();
		expect(readNpsStorage(NPS_STORAGE_KEY)).toEqual(
			expect.objectContaining({type: "answered", value: "7"}),
		);
		await waitFor(() => {
			expect(
				screen.queryByText(NPS_DEFAULT_QUESTION),
			).not.toBeInTheDocument();
		});
	});

	it("stores dismissed and reports no score on close without a digit", async () => {
		const {tracker} = renderPrompt();
		await screen.findByText(NPS_DEFAULT_QUESTION);
		const closeButton = document.querySelector(
			".mantine-Dialog-closeButton",
		);
		expect(closeButton).toBeTruthy();
		fireEvent.click(closeButton as Element);
		expect(tracker.trackEvent).not.toHaveBeenCalled();
		expect(tracker.trackMetric).not.toHaveBeenCalled();
		expect(readNpsStorage(NPS_STORAGE_KEY)?.type).toBe("dismissed");
		expect(window.localStorage.getItem(NPS_STORAGE_KEY)).toContain(
			"dismissed",
		);
		await waitFor(() => {
			expect(
				screen.queryByText(NPS_DEFAULT_QUESTION),
			).not.toBeInTheDocument();
		});
	});

	it("stores a non-numeric option value and sends no metric", async () => {
		const {tracker} = renderPrompt({
			options: [{title: "Promoter", value: "ten"}],
		});
		fireEvent.click(await screen.findByRole("button", {name: "Promoter"}));
		expect(tracker.trackMetric).not.toHaveBeenCalled();
		expect(tracker.trackEvent).not.toHaveBeenCalled();
		expect(readNpsStorage(NPS_STORAGE_KEY)?.value).toBe('"ten"');
		await waitFor(() => {
			expect(
				screen.queryByRole("button", {name: "Promoter"}),
			).not.toBeInTheDocument();
		});
	});

	it("shows no score buttons when options is empty", async () => {
		renderPrompt({options: []});
		await screen.findByText(NPS_DEFAULT_QUESTION);
		expect(
			screen.queryByRole("button", {name: "0"}),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {name: "10"}),
		).not.toBeInTheDocument();
	});

	it("hides an empty start caption and shows the default end caption", async () => {
		renderPrompt({captions: {start: ""}});
		await screen.findByText(NPS_DEFAULT_QUESTION);
		expect(
			screen.queryByText("0 – Not at all likely"),
		).not.toBeInTheDocument();
		expect(screen.getByText("10 – Extremely likely")).toBeInTheDocument();
	});

	it("hides both captions when start and end are empty strings", async () => {
		renderPrompt({captions: {start: "", end: ""}});
		await screen.findByText(NPS_DEFAULT_QUESTION);
		expect(
			screen.queryByText("0 – Not at all likely"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("10 – Extremely likely"),
		).not.toBeInTheDocument();
		expect(document.querySelector(".captions")).not.toBeInTheDocument();
	});

	it("shows an eligible prompt immediately when openDelay is 0", () => {
		renderPrompt({openDelay: 0});
		expect(screen.getByText(NPS_DEFAULT_QUESTION)).toBeInTheDocument();
	});

	it("stays closed when storage hides the prompt even after openDelay", () => {
		jest.useFakeTimers();
		window.localStorage.setItem(
			NPS_STORAGE_KEY,
			JSON.stringify({
				date: new Date().toISOString(),
				type: "dismissed",
			}),
		);
		renderPrompt({openDelay: 5});
		act(() => {
			jest.advanceTimersByTime(5000);
		});
		expect(
			screen.queryByText(NPS_DEFAULT_QUESTION),
		).not.toBeInTheDocument();
	});

	it("applies dialogProps size and position", async () => {
		renderPrompt({
			dialogProps: {size: 320, position: {top: 40, left: 16}},
		});
		await screen.findByText(NPS_DEFAULT_QUESTION);
		const dialog = document.querySelector(".mantine-Dialog-root");
		const affix = document.querySelector(".mantine-Affix-root");
		expect(dialog).toBeTruthy();
		expect(affix).toBeTruthy();
		expect(
			(dialog as HTMLElement).style.getPropertyValue("--dialog-size"),
		).toContain("20rem");
		expect(
			(affix as HTMLElement).style.getPropertyValue("--affix-top"),
		).toContain("2.5rem");
		expect(
			(affix as HTMLElement).style.getPropertyValue("--affix-left"),
		).toContain("1rem");
	});

	it("keeps a dialog width of about 640 pixels when dialogProps is absent", async () => {
		renderPrompt();
		await screen.findByText(NPS_DEFAULT_QUESTION);
		const dialog = document.querySelector(".mantine-Dialog-root");
		expect(dialog).toBeTruthy();
		expect(
			(dialog as HTMLElement).style.getPropertyValue("--dialog-size"),
		).toContain("40rem");
	});

	it("renders stack and group layout defaults", async () => {
		renderPrompt();
		const question = await screen.findByText(NPS_DEFAULT_QUESTION);
		const stack = question.parentElement as HTMLElement;
		expect(stack).toHaveClass("mantine-Stack-root");
		expect(stack.style.getPropertyValue("--stack-gap")).toContain(
			"--mantine-spacing-sm",
		);

		const digits = screen.getByRole("button", {name: "0"})
			.parentElement as HTMLElement;
		expect(digits).toHaveClass("mantine-Group-root");
		expect(digits).toHaveClass("digits");
		expect(digits.style.getPropertyValue("--group-gap")).toContain(
			"--mantine-spacing-xs",
		);
		expect(digits.style.getPropertyValue("--group-justify")).toBe(
			"space-between",
		);
		expect(digits.style.getPropertyValue("--group-wrap")).toBe("wrap");

		const captions = screen.getByText("0 – Not at all likely")
			.parentElement as HTMLElement;
		expect(captions).toHaveClass("mantine-Group-root");
		expect(captions).toHaveClass("captions");
		expect(captions.style.getPropertyValue("--group-justify")).toBe(
			"space-between",
		);
		expect(screen.getByRole("button", {name: "7"})).toHaveAttribute(
			"data-variant",
			"default",
		);
		expect(
			screen
				.getByText("10 – Extremely likely")
				.style.getPropertyValue("--text-fz"),
		).toContain("--mantine-font-size-sm");
	});

	it("applies digitsGroupProps, stackProps, and dialogProps", async () => {
		renderPrompt({
			digitsGroupProps: {gap: "lg", justify: "flex-end", wrap: "nowrap"},
			stackProps: {gap: "xl"},
			dialogProps: {radius: "md", size: 320},
		});
		const question = await screen.findByText(NPS_DEFAULT_QUESTION);
		const stack = question.parentElement as HTMLElement;
		expect(stack.style.getPropertyValue("--stack-gap")).toContain(
			"--mantine-spacing-xl",
		);
		const digits = screen.getByRole("button", {name: "0"})
			.parentElement as HTMLElement;
		expect(digits).toHaveClass("digits");
		expect(digits.style.getPropertyValue("--group-gap")).toContain(
			"--mantine-spacing-lg",
		);
		expect(digits.style.getPropertyValue("--group-justify")).toBe(
			"flex-end",
		);
		expect(digits.style.getPropertyValue("--group-wrap")).toBe("nowrap");
		const dialog = document.querySelector(
			".mantine-Dialog-root",
		) as HTMLElement;
		expect(dialog.style.getPropertyValue("--paper-radius")).toContain(
			"--mantine-radius-md",
		);
		expect(dialog.style.getPropertyValue("--dialog-size")).toContain(
			"20rem",
		);
	});

	it("applies question, option, and caption style props", async () => {
		renderPrompt({
			questionTextProps: {fw: 700},
			optionButtonProps: {style: {letterSpacing: "0.3em"}},
			captionTextProps: {fs: "italic"},
		});
		expect(await screen.findByText(NPS_DEFAULT_QUESTION)).toHaveStyle({
			fontWeight: "700",
		});
		expect(screen.getByRole("button", {name: "7"})).toHaveStyle({
			letterSpacing: "0.3em",
		});
		expect(screen.getByText("10 – Extremely likely")).toHaveStyle({
			fontStyle: "italic",
		});
	});
});
