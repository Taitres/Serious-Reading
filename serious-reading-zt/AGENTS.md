When reading large logs, search results, JSON outputs, stack traces, or long files, use the Headroom MCP tools first.

Prefer:
- headroom_compress for large content
- headroom_retrieve when exact original details are needed
- headroom_stats when asked about compression savings

# Codebase exploration rules

When answering questions about architecture, dependencies, call graphs, symbol definitions, dead code, impact analysis, or "where is this used", prefer using the codebase-memory-mcp tools before doing broad grep/search.

Use codebase-memory-mcp for:
- finding callers/callees
- tracing call paths
- locating symbol definitions
- understanding module relationships
- impact analysis before changing shared code

Do not rely only on grep when a structural code graph query would be more precise.

If codebase-memory-mcp results are incomplete or stale, then fall back to reading files and searching the repository directly.