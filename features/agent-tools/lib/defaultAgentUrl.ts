export type AppBuilderEnvironmentIdentifier =
	| "localhost"
	| "sandbox"
	| "development"
	| "staging"
	| "production"
	| "iframe"
	| "unknown";

const DEFAULT_AGENT_URL: Partial<
	Record<AppBuilderEnvironmentIdentifier, string>
> = {
	localhost: "http://localhost:3001",
	sandbox: "https://dev-agent.shapediver.com",
	development: "https://dev-agent.shapediver.com",
	staging: "https://staging-agent.shapediver.com",
	production: "https://agent.shapediver.com",
	iframe: "https://agent.shapediver.com",
};

export function defaultAgentUrlForEnvironment(
	identifier: string,
): string | undefined {
	return DEFAULT_AGENT_URL[identifier as AppBuilderEnvironmentIdentifier];
}
