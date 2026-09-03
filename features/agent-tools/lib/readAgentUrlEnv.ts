/** Vite `import.meta.env` for the Agent URL fallback. */
export function readAgentUrlEnv(): string | undefined {
	return import.meta.env.VITE_AGENT_URL;
}
