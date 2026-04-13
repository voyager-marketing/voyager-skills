---
name: report
description: "Use this skill when the user asks to generate a client report, monthly report, check client performance, or produce analytics for a client."
argument-hint: "<client-name> [month] [--notion] [--format=table|markdown]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page]
user-invocable: true
---

# Client Report Generator

Generate monthly client reports combining Voyager Orbit lead/analytics data with Notion content pipeline data.

## Notion IDs

| Database | ID |
|----------|----|
| Content | `cba94900-3a60-4292-ba6b-f8aeea62e439` |
| Client Profiles | `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033` |

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file, or resolve it via:
```bash
wp --info --format=json | jq -r '.wp_root'
```

## Step 1: Resolve Client

If a client name was provided, search the Notion Client Profiles DB for the client:
```
notion-search: query="<client-name>" filter_type="page"
```
Look for matches within the Client Profiles collection (`collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`).

If no client name was provided, list available clients from the collection and ask the user to choose.

## Step 2: Determine Month

- Default to the current month if not specified
- Accept formats like "March 2026", "2026-03", "last month"
- Resolve to `YYYY-MM` format for the WP-CLI query

## Step 3: Generate Report Data

Call the WordPress ability via WP-CLI to pull lead and analytics data:

```bash
wp --path=$WP_ROOT --user=1 eval '
$ability = wp_get_ability("voyager-orbit/generate-client-report");
if ($ability) {
    $result = $ability->execute(["month" => "YYYY-MM", "include_blocks" => true]);
    echo json_encode($result, JSON_PRETTY_PRINT);
} else {
    echo json_encode(["error" => "generate-client-report ability not registered"]);
}
'
```

**Fallback:** If the ability is not registered (Orbit ability load order issue), query the database directly:

```bash
wp --path=$WP_ROOT --user=1 eval '
global $wpdb;

$month_start = "YYYY-MM-01 00:00:00";
$month_end = "YYYY-MM-31 23:59:59";

// Lead counts by type
$leads = $wpdb->get_results($wpdb->prepare(
    "SELECT lead_type, COUNT(*) as count FROM {$wpdb->prefix}voyager_leads
     WHERE created_at BETWEEN %s AND %s
     GROUP BY lead_type",
    $month_start, $month_end
));

// Lead counts by source
$sources = $wpdb->get_results($wpdb->prepare(
    "SELECT source, COUNT(*) as count FROM {$wpdb->prefix}voyager_leads
     WHERE created_at BETWEEN %s AND %s
     GROUP BY source ORDER BY count DESC",
    $month_start, $month_end
));

// Activity count
$activities = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}voyager_activity
     WHERE created_at BETWEEN %s AND %s",
    $month_start, $month_end
));

// Previous month for comparison
$prev_start = date("Y-m-01 00:00:00", strtotime($month_start . " -1 month"));
$prev_end = date("Y-m-t 23:59:59", strtotime($month_start . " -1 month"));
$prev_leads = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}voyager_leads
     WHERE created_at BETWEEN %s AND %s",
    $prev_start, $prev_end
));

echo json_encode([
    "leads" => $leads,
    "sources" => $sources,
    "total_leads" => array_sum(array_column($leads, "count")),
    "prev_month_leads" => (int)$prev_leads,
    "activities" => (int)$activities,
], JSON_PRETTY_PRINT);
'
```

## Step 4: Generate Content Report

Query the Notion Content DB (`cba94900-3a60-4292-ba6b-f8aeea62e439`) for the client's content items for the target month:

```
notion-search: query="<client-name>" filter_type="page"
```

Then fetch each matching content page to collect:
- How many content items were created, drafted, published
- Which keywords were targeted
- Published links
- Content type (Blog, Page, etc.)

Filter results to the target month by checking the Created/Scheduled/Published dates on each item.

## Step 5: Format Output

### Default (`--format=markdown` or no flag)

Display as a formatted markdown report with these sections:

```
## Monthly Report: <Client Name> -- <Month Year>

### Executive Summary
- X leads captured (change vs previous month)
- Y content items published
- Z admin activities tracked

### Lead Performance
| Metric | Value |
|--------|-------|
| Total Leads | X |
| Phone Clicks | X |
| Form Submissions | X |
| Top Source | Organic (X%) |
| Avg Score | X/100 |

### Content Published
| Title | Type | Keyword | Link |
|-------|------|---------|------|
| Example Post Title | Blog | target keyword | https://... |

### Activity Summary
- Total activities: X
- Key activity types and counts

### Recommendations
- Trend analysis based on month-over-month comparison
- Content strategy suggestions based on keyword performance
- Lead source optimization recommendations
```

### `--format=table` flag

Output condensed tables only, no prose sections. Skip Executive Summary and Recommendations. Just the data tables with a one-line header.

### `--notion` flag

If passed, create a Notion page with the full report content:

```
notion-create-pages:
  parent_type: "page"
  parent_id: "<client-profile-page-id>"
  title: "Monthly Report -- <Month Year>"
  content_markdown: "<full report markdown>"
```

Report the Notion page URL back to the user after creation.

## Output Example

```
## Monthly Report: Built Right Homes -- March 2026

### Executive Summary
- 47 leads captured (up 12% vs February)
- 8 content items published
- 156 admin activities tracked

### Lead Performance
| Metric | Value |
|--------|-------|
| Total Leads | 47 |
| Phone Clicks | 23 |
| Form Submissions | 24 |
| Top Source | Organic (42%) |
| Avg Score | 68/100 |

### Content Published
| Title | Type | Keyword | Link |
|-------|------|---------|------|
| Build on Your Lot Virginia | Blog | build on your lot virginia | https://... |

### Recommendations
- Lead volume up 12% -- organic SEO strategy is working
- Consider expanding "build on your lot" content cluster
```

## Important Notes

- **WP Root:** Resolve from CLAUDE.md or `wp --info`
- **DB Prefix:** Use `$wpdb->prefix` — do not hardcode
- The `generate-client-report` ability may not be registered due to Orbit ability load order. Always be prepared to fall back to direct DB queries.
- Always use `$wpdb->prepare()` for all database queries -- no exceptions.
- When comparing months, calculate percentage change: `((current - previous) / previous) * 100`.
- If lead count is zero or the tables don't exist, report that clearly rather than erroring.
