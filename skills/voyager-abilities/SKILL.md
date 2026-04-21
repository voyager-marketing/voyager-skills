---
name: voyager-abilities
description: "Create and register WordPress Abilities for Voyager Orbit — schemas, permissions, MCP exposure, AbilityBridge, Chat tool integration."
compatibility: "PHP 8.1+, WordPress 6.9+ (Abilities API), MCP Adapter 0.5+"
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Abilities Development

## When to use

- Registering a new ability for Voyager Orbit
- Making an ability discoverable via MCP (Claude, Cursor, AI agents)
- Adding an ability as a Chat module tool
- Working with the AbilityBridge for Portal remote execution
- Understanding how Orbit's 32+ abilities are structured

## Inputs required

- What the ability does (data query, content generation, site action)
- Whether it's read-only or destructive
- Whether it should be exposed via MCP and/or the Chat module

## Procedure

### 1. Register the ability

All abilities register on the `wp_abilities_api_init` hook. Data abilities go in `src/Abilities.php`, content generation abilities in `src/Modules/ContentGeneration/abilities.php`.

```php
add_action('wp_abilities_api_init', function() {
    wp_register_ability('voyager-orbit/my-ability', [
        'label'       => __('My Ability', 'voyager-orbit'),
        'description' => __('Clear description of what this does and what it returns.', 'voyager-orbit'),
        'category'    => 'voyager-leads',  // Must be pre-registered
        'input_schema' => [
            'type'       => 'object',
            'properties' => [
                'param1' => [
                    'type'        => 'string',
                    'description' => 'What this parameter does',
                ],
                'per_page' => [
                    'type'    => 'integer',
                    'default' => 20,
                    'minimum' => 1,
                    'maximum' => 100,
                ],
            ],
            'additionalProperties' => false,
        ],
        'output_schema' => [
            'type'       => 'object',
            'properties' => [
                'data'  => ['type' => 'array'],
                'total' => ['type' => 'integer'],
            ],
        ],
        'execute_callback'    => function (array $input = []): array {
            // Use existing REST endpoints when possible
            $request = new \WP_REST_Request('GET', '/voyager/v1/leads');
            foreach ($input as $key => $value) {
                $request->set_param($key, $value);
            }
            return rest_do_request($request)->get_data();
        },
        'permission_callback' => fn(): bool => current_user_can('manage_options'),
        'meta' => [
            'annotations' => [
                'readonly'    => true,   // Does not modify state
                'destructive' => false,  // Does not delete data
                'idempotent'  => true,   // Same input = same output
            ],
            'show_in_rest' => true,       // Discoverable via REST API
            'mcp'          => ['public' => true],  // Exposed as MCP tool
        ],
    ]);
});
```

### 2. Register the category (if new)

Categories register on `wp_abilities_api_categories_init`:

```php
add_action('wp_abilities_api_categories_init', function() {
    wp_register_ability_category('voyager-my-category', [
        'label'       => __('My Category', 'voyager-orbit'),
        'description' => __('What this category groups.', 'voyager-orbit'),
    ]);
});
```

Existing categories:
- `voyager-leads` — Lead data queries
- `voyager-analytics` — Reports and insights
- `voyager-activity` — Admin activity tracking
- `voyager-site-management` — Health, plugins, config
- `voyager-reporting` — Structured client reports
- `voyager-publishing` — Content CRUD operations
- `voyager-media` — Media uploads
- `voyager-content` — AI content generation (blocks)
- `voyager-theme-content` — Theme CPT content
- `voyager-theme-design` — Design tokens, accessibility
- `voyager-content-utilities` — Rewriting, translation, FAQ
- `voyager-content-agents` — Multi-step agent workflows

### 3. MCP exposure

Any ability with `'mcp' => ['public' => true]` in meta is **automatically** exposed as an MCP tool by the MCP Adapter plugin. No additional code needed.

The MCP Adapter converts:
- Abilities → MCP **tools** (executable actions)
- Abilities → MCP **resources** (contextual data)
- Abilities → MCP **prompts** (structured guidance)

### 4. AbilityBridge (Portal remote execution)

The AbilityBridge module (`src/Modules/AbilityBridge/`) exposes all abilities via HMAC-authenticated REST endpoints:

- `GET /voyager/v1/abilities` — List all abilities with schemas
- `GET /voyager/v1/abilities/manifest` — Lightweight manifest for caching
- `POST /voyager/v1/abilities/execute` — Execute by name

Portal calls these endpoints with HMAC signatures to run abilities remotely.

### 5. Chat module tool integration

To make an ability usable by the Chat module:

1. Add the ability name to `ToolExecutor::ALLOWED_ABILITIES` in `src/Modules/Chat/Services/ToolExecutor.php`
2. The ability must be registered via `wp_register_ability()`
3. ToolExecutor wraps `AbilityExecutor::execute()` with the allowlist check

### 6. Content generation abilities (AI-powered)

For abilities that call the AI Client:

```php
'execute_callback' => function (array $input = []): array {
    if (!function_exists('wp_ai_client_prompt')) {
        return ['error' => 'AI provider not configured.'];
    }

    $schema = voyager_strict_schema([
        'type' => 'object',
        'properties' => [
            'result' => ['type' => 'string'],
        ],
        'required' => ['result'],
    ]);

    $result = wp_ai_client_prompt($prompt)
        ->using_model_preference(voyager_content_model_preference())
        ->using_system_instruction($system)
        ->using_temperature(0.7)
        ->as_json_response($schema)
        ->generate_text();

    if (is_wp_error($result)) {
        return ['error' => $result->get_error_message()];
    }

    return json_decode($result, true) ?: ['error' => 'Invalid response'];
},
```

**Important**: Use `voyager_strict_schema()` to add `additionalProperties: false` recursively — required by Anthropic's structured output.

## Verification

- Ability appears in `GET /wp-json/wp-abilities/v1/abilities`
- Ability appears in Orbit > AI Dashboard abilities grid
- If MCP public: appears in `wp mcp-adapter serve` tool list
- If Chat tool: Chat module can call it via `<tool_call>` tags

## Failure modes

- **Ability not found**: Check hook priority — `wp_abilities_api_init` fires after `init`
- **Permission denied**: AbilityBridge sets admin user context for Portal requests; Chat module also elevates
- **MCP not exposing**: Verify `mcp.public = true` in meta AND MCP Adapter plugin is active
- **Schema validation error**: Anthropic requires `additionalProperties: false` on all objects — use `voyager_strict_schema()`

## Escalation

- Abilities API source: `wp-includes/abilities-api.php` (WordPress 6.9+)
- MCP Adapter docs: `https://github.com/WordPress/mcp-adapter`
- Orbit abilities: `src/Abilities.php` (data) + `src/Modules/ContentGeneration/abilities.php` (content)
