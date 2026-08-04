import {resolveInteractionPresentation} from "../resolveInteractionPresentation";

describe("resolveInteractionPresentation", () => {
	it('returns "widget" when presentation is undefined and not alwaysActive', () => {
		expect(resolveInteractionPresentation(undefined, false)).toBe("widget");
	});

	it('returns "toolbar" when presentation is undefined and alwaysActive is true', () => {
		expect(resolveInteractionPresentation(undefined, true)).toBe("toolbar");
	});

	it('returns explicit "widget" even when alwaysActive is true', () => {
		expect(resolveInteractionPresentation("widget", true)).toBe("widget");
	});

	it('returns explicit "toolbar" when alwaysActive is false', () => {
		expect(resolveInteractionPresentation("toolbar", false)).toBe("toolbar");
	});
});
