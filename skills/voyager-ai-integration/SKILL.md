---
name: voyager-ai-integration
description: "AI integration patterns in Voyager Orbit — WP AI Client, model preferences, Content Guidelines, structured output, Chat module orchestration, and AI-powered abilities."
compatibility: "PHP 8.1+, WordPress 7.0+ (AI Client in core), AI Provider for Anthropic 1.0+"
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager AI Integration

## When to use

- Adding AI-powered features to Voyager Orbit
- Creating content generation abilities that call Claude/AI providers
- Working with the Chat module's AI orchestration pipeline
- Integrating with WordPress Content Guidelines for brand voice
- Configuring model preferences or switching AI providers
- Building structured JSON output from AI responses

## Inputs required

- What AI capability you're building (content gen, analysis, chat response)
- Whether you need structured output (JSON schema) or free-form text
- Whether the feature should work with any AI provider or Claude-specific

## Procedure

### 1. Call the AI Client

WordPress 7.0 bundles the PHP AI Client. The WordPress wrapper:

```php
// Basic text generation
$result = wp_ai_client_prompt('Summarize this article')
    ->using_model_preference(voyager_content_model_preference('summary'))
    ->using_system_instruction('You are a concise editor.')
    ->using_temperature(0.5)
    ->using_max_tokens(500)
    ->generate_text();

if (is_wp_error($result)) {
    return ['error' => $result->get_error_message()];
}
```

The underlying SDK (also available directly):
```php
use WordPress\AiClient\AiClient;

AiClient::prompt('Generate a title')
    ->usingModel($model)
    ->usingSystemInstruction('You are helpful.')
    ->usingTemperature(0.7)
    ->generateText();
```

### 2. Model preference system

Orbit uses filterable model preferences instead of hardcoding:

**Content generation** (`src/Modules/ContentGeneration/abilities.php`):
```php
// Returns 'claude-haiku-4-5' by default, filterable
$model = voyager_content_model_preference('testimonials');

// Override in a theme or plugin:
add_filter('voyager_content_model_preference', fn($model, $ctx) =>
    $ctx === 'testimonials' ? 'claude-sonnet-4' : $model, 10, 2);

// Use site default provider (empty string):
add_filter('voyager_content_model_preference', fn() => '');
```

**Chat module** (`src/Modules/Chat/Services/ChatService.php`):
```php
// Filterable separately from content generation
add_filter('voyager_chat_model_preference', fn() => 'claude-sonnet-4');
```

### 3. Structured JSON output

Anthropic requires `additionalProperties: false` on all object schemas. Use the helper:

```php
$schema = voyager_strict_schema([
    'type' => 'object',
    'properties' => [
        'title'   => ['type' => 'string'],
        'content' => ['type' => 'string'],
        'tags'    => [
            'type'  => 'array',
            'items' => ['type' => 'string'],
        ],
    ],
    'required' => ['title', 'content'],
]);

$result = wp_ai_client_prompt($prompt)
    ->using_model_preference(voyager_content_model_preference())
    ->using_system_instruction($system)
    ->using_temperature(0.7)
    ->as_json_response($schema)  // Enforces structured output
    ->generate_text();

$data = json_decode($result, true);
```

`voyager_strict_schema()` recursively adds `additionalProperties: false` to all nested objects. Defined in `src/Modules/ContentGeneration/abilities.php`.

### 4. Content Guidelines integration

WordPress Content Guidelines (Gutenberg 22.7+) provide site-wide brand voice rules. The Chat module reads them automatically:

**CPT**: `wp_guideline` (singleton per site)
**Meta fields**:
- `_content_guideline_site` — site goals, audience, industry
- `_content_guideline_copy` — tone, voice, brand personality
- `_content_guideline_images` — styles, colors, moods
- `_content_guideline_additional` — accessibility, formatting

**Reading guidelines in code** (see `ContextBuilder::getGuidelines()`):
```php
$posts = get_posts([
    'post_type'      => 'wp_guideline',
    'post_status'    => 'publish',
    'posts_per_page' => 1,
]);

if ($posts) {
    $copy = get_post_meta($posts[0]->ID, '_content_guideline_copy', true);
    $site = get_post_meta($posts[0]->ID, '_content_guideline_site', true);
    // Inject into system prompt...
}
```

**REST API** (experimental): `GET /gutenberg/v0/content-guidelines`
Will become `GET /wp/v2/content-guidelines` when merged to core.

### 5. Chat module AI orchestration

The Chat pipeline in `src/Modules/Chat/Services/`:

```
User message
    → RestApi.php (rate limit check, store message)
    → ChatService.php (orchestrator)
        → ContextBuilder.php (builds system prompt)
            - Site info, page context, content summary
            - Content Guidelines (brand voice)
            - SEO data (RankMath/Yoast)
            - Lead stats (7-day summary)
        → wp_ai_client_prompt() (call Claude)
        → parseResponse() (extract <tool_call> tags)
        → ToolExecutor.php (execute abilities)
            - Allowlist of ~20 abilities
            - Wraps AbilityExecutor::execute()
        → Loop back for tool results (max 5 iterations)
    → Store assistant response
    → Return to user
```

**Tool calling**: Chat uses prompt-based `<tool_call>` XML tags (not native API tool_use) because `wp_ai_client_prompt()` doesn't expose native tool calling directly.

**Adding a new Chat tool**:
1. Register the ability via `wp_register_ability()`
2. Add the ability name to `ToolExecutor::ALLOWED_ABILITIES` array
3. The Chat module will automatically discover and use it

### 6. Create an AI-powered ability

Full pattern used by ContentGeneration abilities:

```php
wp_register_ability('voyager-content/my-generator', [
    'label'       => __('Generate Something', 'voyager-orbit'),
    'description' => __('Uses AI to generate...', 'voyager-orbit'),
    'category'    => 'voyager-content',
    'input_schema' => [
        'type'       => 'object',
        'properties' => [
            'topic' => ['type' => 'string', 'description' => 'Topic to generate about'],
            'count' => ['type' => 'integer', 'default' => 3, 'minimum' => 1, 'maximum' => 10],
        ],
        'additionalProperties' => false,
    ],
    'output_schema' => [/* ... */],
    'execute_callback' => function (array $input = []): array {
        if (!function_exists('wp_ai_client_prompt')) {
            return ['error' => 'AI provider not configured. Install AI Provider for Anthropic and add your API key under Settings > Connectors.'];
        }

        $topic = sanitize_text_field($input['topic'] ?? '');
        $count = absint($input['count'] ?? 3);

        $schema = voyager_strict_schema([/* output schema */]);

        $system = sprintf('You are a professional copywriter for %s.', get_bloginfo('name'));
        $prompt = sprintf('Generate %d items about: %s', $count, $topic);

        $result = wp_ai_client_prompt($prompt)
            ->using_model_preference(voyager_content_model_preference('my-generator'))
            ->using_system_instruction($system)
            ->using_temperature(0.7)
            ->as_json_response($schema)
            ->generate_text();

        if (is_wp_error($result)) {
            return ['error' => $result->get_error_message()];
        }

        $data = json_decode($result, true);
        return is_array($data) ? $data : ['error' => 'Invalid AI response'];
    },
    'permission_callback' => fn(): bool => current_user_can('edit_posts'),
    'meta' => [
        'show_in_rest' => true,
        'mcp'          => ['public' => true],
    ],
]);
```

### 7. Detect AI provider availability

```php
// Check if any AI provider is configured
$ai_available = function_exists('wp_ai_client_prompt');

// Check specifically for Anthropic (via AI Client SDK)
if (class_exists(\WordPress\AiClient\AiClient::class)) {
    $anthropic_ready = \WordPress\AiClient\AiClient::isConfigured('anthropic');
}
```

### 8. WP AI Plugin hooks (optional integration)

If the official WordPress AI plugin is active:
```php
// Override preferred text models to favor Claude
add_filter('wpai_preferred_text_models', fn($models) =>
    array_merge(['claude-haiku-4-5', 'claude-sonnet-4'], $models));

// Hook into content normalization
add_filter('wpai_normalize_content', fn($content) =>
    /* add Voyager-specific processing */ $content);
```

## Verification

- AI calls return valid responses (not WP_Error)
- Structured output matches the defined JSON schema
- Content Guidelines appear in Chat system prompt when configured
- Model preference filters work (test with `add_filter`)
- Abilities with AI appear in Orbit > AI Dashboard

## Failure modes

- **"AI provider not configured"**: Install AI Provider for Anthropic + set `ANTHROPIC_API_KEY`
- **JSON parse error**: Check that `voyager_strict_schema()` is applied to all schemas
- **Rate limit from Anthropic**: Reduce temperature, use Haiku instead of Sonnet/Opus
- **Empty guidelines**: CPT is `wp_guideline` (not `wp_content_guideline`), requires Gutenberg 22.7+
- **Tools not executing in Chat**: Check ability is in `ToolExecutor::ALLOWED_ABILITIES`

## Escalation

- AI Client SDK: `https://github.com/WordPress/php-ai-client`
- AI Provider for Anthropic: `https://github.com/WordPress/ai-provider-for-anthropic`
- Content Guidelines: `https://make.wordpress.org/ai/` (Gutenberg 22.7 announcement)
- Orbit ContentGeneration: `src/Modules/ContentGeneration/abilities.php`
- Orbit Chat pipeline: `src/Modules/Chat/Services/ChatService.php`
