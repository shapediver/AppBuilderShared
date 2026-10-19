import {useHostedAgentFrameStore} from "../useHostedAgentFrameStore";

describe("useHostedAgentFrameStore", () => {
	const first = {id: "first"} as unknown as Window;
	const second = {id: "second"} as unknown as Window;

	beforeEach(() => {
		useHostedAgentFrameStore.setState({frame: null});
	});

	it("registers a frame window", () => {
		useHostedAgentFrameStore.getState().setFrame(first);
		expect(useHostedAgentFrameStore.getState().frame).toBe(first);
	});

	it("ignores clear of a replaced window", () => {
		const {setFrame, clearFrame} = useHostedAgentFrameStore.getState();
		setFrame(first);
		setFrame(second);
		clearFrame(first);
		expect(useHostedAgentFrameStore.getState().frame).toBe(second);
	});

	it("clears the active window", () => {
		const {setFrame, clearFrame} = useHostedAgentFrameStore.getState();
		setFrame(first);
		clearFrame(first);
		expect(useHostedAgentFrameStore.getState().frame).toBeNull();
	});
});
