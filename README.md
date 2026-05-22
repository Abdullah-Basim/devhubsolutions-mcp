# @dev-hub-solutions/mcp

An MCP server that gives Claude Desktop, Claude Code, and Cursor 17 dev tools they can call directly inside any conversation. No browser tab to switch to. No copy-paste between apps.

**Tools included**: JSON formatter, JWT decoder, UUID v4/v7 generator, password generator, regex tester, MD5/SHA-* hasher, Base64 encoder/decoder, URL encoder/decoder, case converter, word counter, Lorem Ipsum generator, Markdown→HTML, text diff, color converter (HEX↔RGB↔HSL↔OKLCH), timezone converter, QR code generator, token counter (Claude/GPT/Gemini), prompt refiner.

Built and maintained by the [Dev Hub Solutions](https://devhubsolutions.net) team — same logic as our [free browser tools](https://devhubsolutions.net/tools), now callable from inside your AI client.

## Install

### Claude Code

```bash
claude mcp add devhubsolutions npx -y @dev-hub-solutions/mcp
```

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "devhubsolutions": {
      "command": "npx",
      "args": ["-y", "@dev-hub-solutions/mcp"]
    }
  }
}
```

Restart Claude Desktop.

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "devhubsolutions": {
      "command": "npx",
      "args": ["-y", "@dev-hub-solutions/mcp"]
    }
  }
}
```

Restart Cursor.

## Tools

### Encoding

| Tool | What it does |
|---|---|
| `base64_encode` | UTF-8-safe Base64 encode. `urlSafe: true` for Base64url. |
| `base64_decode` | Base64 / Base64url decode to UTF-8 text. |
| `url_encode` | URL-encode (component or full URI mode). |
| `url_decode` | URL-decode (component or full URI mode). |

### Hashing

| Tool | What it does |
|---|---|
| `hash_text` | MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512. Not for password storage. |
| `hash_text_all` | Compute all five hashes in one call. |

### Identifiers

| Tool | What it does |
|---|---|
| `generate_uuid` | UUID v4 (random) or v7 (time-ordered, RFC 9562). Up to 1000 at once. |

### Format / validate

| Tool | What it does |
|---|---|
| `json_format` | Pretty-print, minify, or validate JSON with line-number errors. |
| `jwt_decode` | Decode JWT header + payload locally. Does NOT verify signature. |

### Text

| Tool | What it does |
|---|---|
| `convert_case` | camelCase, PascalCase, snake_case, kebab-case, Title Case, etc. all in one call. |
| `count_words` | Characters, words, sentences, paragraphs, reading time. |
| `generate_lorem` | Lorem Ipsum placeholder text (words / sentences / paragraphs). |
| `markdown_to_html` | GitHub-Flavored Markdown → HTML. |
| `diff_text` | Line-level diff between two strings. |

### Generators

| Tool | What it does |
|---|---|
| `generate_password` | Cryptographically secure random passwords. Configurable length, classes, count. |
| `generate_qr` | QR code as SVG string or Base64 PNG data URI. |

### Regex

| Tool | What it does |
|---|---|
| `test_regex` | Run a JS regex against text, return all matches with capture groups. |

### Color

| Tool | What it does |
|---|---|
| `convert_color` | HEX → RGB, HSL, OKLCH. |

### Time

| Tool | What it does |
|---|---|
| `convert_timezone` | Convert a datetime between any two IANA timezones. |

### LLM workflow

| Tool | What it does |
|---|---|
| `count_tokens` | Per-model token + cost estimate (Claude 4.x, GPT-4o family, Gemini 2.5). |
| `refine_prompt` | Restructure a rough prompt into the role/context/task/constraints/output pattern. |

## Example usage in Claude

> Ask Claude: *"Decode this JWT and tell me when it expires: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"*

Claude calls `jwt_decode`, gets the header + payload back, and tells you the token has no `exp` claim. No browser tab, no jwt.io.

> *"Generate 5 UUID v7s for my test fixtures and save them to a file"*

Claude calls `generate_uuid` with `version: "v7", count: 5`, then writes the result wherever you asked.

> *"Convert this hex color #3B82F6 to OKLCH for my design tokens"*

Claude calls `convert_color`, returns `oklch(60.43% 0.215 254.05)`, ready to paste.

## Privacy & safety

- **Everything runs locally** in your client process. No network calls, no telemetry, no data leaving your machine.
- **No environment variables required.** All tools are self-contained.
- **No file system access.** The server only operates on data passed in via tool arguments.

## Build / develop

```bash
git clone https://github.com/Abdullah-Basim/devhubsolutions-mcp.git
cd devhubsolutions-mcp
npm install
npm run build
npm start
```

Test against a real client by adding it to your Claude Code config with the local path:

```bash
claude mcp add devhubsolutions-dev node /absolute/path/to/dist/bin/devhubsolutions-mcp.js
```

## License

MIT — see [LICENSE](./LICENSE).

## Links

- Free browser versions of every tool: <https://devhubsolutions.net/tools>
- MCP server directory (with install snippets for every popular server): <https://devhubsolutions.net/mcphub>
- Issues: <https://github.com/Abdullah-Basim/devhubsolutions-mcp/issues>
