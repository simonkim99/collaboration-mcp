# Collaboration MCP Server

MCP (Model Context Protocol) server for managing multiple AI services via shell commands.

## Features

- **Multiple AI Services**: Configure and manage multiple AI services with custom names and aliases
- **Shell Command Execution**: Execute AI services as shell commands (not API calls)
- **Flexible Configuration**: Per-service configuration for commands, models, formats, and options
- **Role & Personality**: Automatically inject role and personality into prompts
- **Inference Mode**: Support for separate inference models with reasoning capabilities
- **Stream JSON Support**: Parse and format stream-json outputs
- **Service Management**: Runtime MCP tools for managing services
- **Dual Transport**: Support for both stdio (local) and HTTP (remote) connections

## Installation

```bash
npm install
npm run build
```

## Configuration

Services are configured in `config/services.json`. Example:

```json
{
  "services": [
    {
      "name": "제니",
      "aliases": ["jenny"],
      "command": "gemini",
      "model": "gemini-2.5-fresh",
      "inferenceModel": "gemini-2.5-pro",
      "options": {
        "promptFlag": "-p",
        "modelFlag": "-m",
        "dirFlag": "-d",
        "inputFormat": "text",
        "outputFormat": "text"
      },
      "env": {},
      "role": "assistant",
      "personality": "친근하고 도움이 되는",
      "workingDir": null
    }
  ]
}
```

### Configuration Options

- `name`: Unique service name
- `aliases`: Alternative names for the service (optional)
- `command`: Shell command to execute
- `model`: Default model to use
- `inferenceModel`: Model for inference/reasoning mode (optional)
- `options`:
  - `promptFlag`: How to pass prompt (`-p` or `positional`)
  - `modelFlag`: Model flag (e.g., `-m`)
  - `dirFlag`: Directory flag (e.g., `-d`)
  - `inputFormat`: `text` or `stream-json` (default: `text`)
  - `outputFormat`: `text` or `json` (default: `text`)
  - `inputFormatFlag`: Flag for input format (e.g., `--input-format`, optional)
  - `outputFormatFlag`: Flag for output format (e.g., `--output-format`, optional)
- `env`: Environment variables (supports `${VAR_NAME}` substitution)
- `role`: Default role (e.g., `assistant`)
- `personality`: Personality description (added to prompts)
- `workingDir`: Working directory (null = use `process.cwd()` dynamically)

## Usage

### Stdio Mode (Default)

```bash
npm start
# or
MCP_TRANSPORT=stdio npm start
```

### HTTP Mode

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 npm start
```

## MCP Tools

- `chat_with_service`: Chat with a configured service
  - `service`: Service name or alias
  - `prompt`: Prompt to send
  - `useInference`: Use inference model (optional)
  - `model`: Override model (optional)

- `list_services`: List all configured services

- `get_service_config`: Get service configuration
  - `nameOrAlias`: Service name or alias

- `add_service`: Add a new service
  - `serviceConfig`: Service configuration object

- `update_service`: Update a service
  - `nameOrAlias`: Service name or alias
  - `updates`: Partial service configuration

- `remove_service`: Remove a service
  - `nameOrAlias`: Service name or alias

## Development

```bash
npm run dev  # Development mode with tsx
npm run build  # Build TypeScript
```

## License

MIT

