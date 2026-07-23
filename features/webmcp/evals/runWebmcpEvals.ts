/// <reference types="node" />
import {
	loadWebmcpEvalScenarios,
	runWebmcpEvalScenario,
} from "./runWebmcpEvalScenarios";
async function main() {
	const scenarios = loadWebmcpEvalScenarios();
	let failed = 0;

	for (const scenario of scenarios) {
		const reason = await runWebmcpEvalScenario(scenario);

		if (reason) {
			console.log(`[FAIL] ${scenario.id}: ${reason}`);
			failed += 1;
		} else {
			console.log(`[PASS] ${scenario.id}`);
		}
	}

	if (failed > 0) {
		console.log(`\n${failed} scenario(s) failed.`);
		process.exit(1);
	}

	console.log(`\nAll ${scenarios.length} scenario(s) passed.`);
}

void main();
