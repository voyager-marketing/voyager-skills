# Social Platform Playbook

Reference for `social-repurpose` and any other Voyager skill that produces social content. Lifted from the now-retired `social` skill on 2026-04-29 — the orchestration logic was redundant with `social-repurpose` and direct MCP tool calls, but this content is the genuinely useful agency-wide knowledge.

## Platform Constraints

| Platform | Char Limit | Media | Best Post Types | Peak Windows (ET) |
|----------|-----------|-------|-----------------|-------------------|
| Instagram | 2,200 | Required (image/video) | Reel, Carousel, Story, Feed Post | Tue-Thu 10am-1pm, Sat 9am |
| Facebook | 63,206 | Optional | Feed Post, Reel, Story | Wed-Fri 1pm-4pm |
| LinkedIn | 3,000 | Optional | Feed Post (text-heavy) | Tue-Thu 8am-10am, 12pm |
| Twitter/X | 280 | Optional | Thread, Single tweet | Mon-Fri 8am-10am, 12pm-1pm |
| TikTok | 2,200 | Required (video) | Video (15s-3min) | Tue-Thu 7pm-9pm |
| Pinterest | 500 | Required (image) | Pin (vertical 2:3) | Sat-Sun 8pm-11pm, Fri 3pm |
| Google Business | 1,500 | Optional | Update, Offer, Event | Mon-Fri 9am-11am |

**Time zone rule.** All `scheduled_time` values are in the CLIENT'S local time zone. Ask the client's timezone if unknown — don't assume ET.

## Content Quality Rules

1. **Hook first.** The first line must stop the scroll. Question, bold claim, surprising stat, or direct address. Never start with "We" or the brand name.
2. **One post, one idea.** Don't cram multiple messages into one post. If there are multiple angles, create multiple posts.
3. **Platform-native.** LinkedIn is not Instagram. Write differently for each. A carousel caption is not a tweet.
4. **CTA always.** Every post needs a clear next step: comment, click link, save, share, visit, call.
5. **No generic filler.** "Check out our latest blog post!" is not a social post. Extract the VALUE from the blog and lead with that.
6. **Hashtag strategy:**
   - Instagram: 20-30 hashtags in first comment (mix of broad, niche, branded)
   - LinkedIn: 3-5 at end of post
   - Facebook: 1-3 max, or none
   - Twitter: 1-2 woven into text
   - Pinterest: keyword-rich description (no hashtag symbol needed)
7. **Emoji usage.** Match the brand voice. Professional B2B = minimal. Lifestyle/local = moderate. Never lead with emojis.
8. **Content mix (weekly target):**
   - 40% value/educational (tips, how-tos, insights)
   - 25% social proof (client stories, testimonials, results)
   - 20% behind-the-scenes (process, team, culture)
   - 15% promotional (offers, CTAs, services)

## Hard Guardrails

1. **NEVER publish directly.** All posts are created as Draft status. Moving to Scheduled or Published requires explicit user instruction via `social_update_post`.
2. **NEVER schedule without calendar check.** Always run `social_get_calendar` first to avoid conflicts and clustering.
3. **NEVER ignore platform limits.** Check character count against limits before creating. If over, revise — don't truncate.
4. **NEVER post identical content cross-platform.** Each platform gets a platform-native version. Same topic, different execution.
5. **NEVER assume timezone.** Use the client's timezone from their profile. If unknown, ask before scheduling.
6. **NEVER skip the hook.** The first line is 80% of the post's performance. Review it before finalizing.
7. **ALWAYS flag media needs.** Note exactly what media is needed and what dimensions/format. Skills cannot upload media directly.
8. **ALWAYS attribute repurposed content.** If repurposing a blog post or external content, link to the original where appropriate.
9. **ALWAYS check recent posts for topic duplication.** If a topic was covered in the last 14 days, either skip it or find a different angle.
10. **Confirm before creating more than 3 posts.** Show the plan, get approval, then create.
