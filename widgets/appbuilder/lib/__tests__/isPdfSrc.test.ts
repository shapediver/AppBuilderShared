import {isPdfSrc} from "../isPdfSrc";

describe("isPdfSrc", () => {
	it("returns true for application/pdf contentType", () => {
		expect(isPdfSrc(undefined, "application/pdf")).toBe(true);
		expect(isPdfSrc("https://x/a.png", "application/pdf")).toBe(true);
	});

	it("returns true for data:application/pdf URLs", () => {
		expect(isPdfSrc("data:application/pdf;base64,AAA")).toBe(true);
	});

	it("returns true for .pdf paths, including query/hash", () => {
		expect(isPdfSrc("https://cdn.example.com/file.pdf")).toBe(true);
		expect(isPdfSrc("https://cdn.example.com/file.pdf?token=1")).toBe(true);
		expect(isPdfSrc("https://cdn.example.com/file.pdf#page=2")).toBe(true);
		expect(isPdfSrc("/relative/doc.PDF")).toBe(true);
	});

	it("returns false for images and unrelated types", () => {
		expect(isPdfSrc("https://cdn.example.com/file.png")).toBe(false);
		expect(isPdfSrc("data:image/png;base64,AAA")).toBe(false);
		expect(isPdfSrc(undefined, "image/png")).toBe(false);
		expect(isPdfSrc(undefined, undefined)).toBe(false);
		expect(isPdfSrc("https://cdn.example.com/file.pdf.png")).toBe(false);
	});
});
