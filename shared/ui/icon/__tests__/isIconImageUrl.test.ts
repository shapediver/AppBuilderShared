import {isIconImageUrl} from "../isIconImageUrl";

describe("isIconImageUrl", () => {
	it.each([
		"https://cdn.example.com/logo.svg",
		"http://localhost:3000/test.png",
		"//cdn.example.com/icon.webp",
		"blob:https://example.com/3f8a",
		"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>",
		"data:image/png;base64,iVBORw0KGgo=",
		"/test.svg",
		"./assets/brand.jpg",
		"../icons/mark.gif",
		"brand-mark.avif",
		"folder/logo.ICO",
	])("accepts %s", (value) => {
		expect(isIconImageUrl(value)).toBe(true);
	});

	it.each([
		"tabler:photo",
		"tabler:check",
		"photo",
		"icon-hand-finger",
		"SD_AB",
		"data:text/html,<svg></svg>",
		"javascript:alert(1)",
		"",
		"   ",
	])("rejects %s", (value) => {
		expect(isIconImageUrl(value)).toBe(false);
	});
});
