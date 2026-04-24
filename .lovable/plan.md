# Community Intelligence Layer: Polls, Discussions & Admin Control

Frontend-only implementation using mock data (extending `src/data/mockData.ts`). No backend changes. Three pillars: **Upvotes**, **Polls**, **Discussions** — each independent, all surfaced in Public Dashboard sidebar and moderated from Admin Dashboard.

---

## 1. Mock Data Additions (`src/data/mockData.ts`)

```ts
export interface Poll {
  id: string;
  issueId: string;
  question: string;
  options: { label: string; votes: number }[];
  active: boolean;
  createdAt: string;
}
export interface DiscussionComment {
  id: string;
  issueId: string;
  user: string;
  text: string;
  time: string;
  flagged?: boolean;
}
export interface AIWeights {
  voteWeight: number;     // default 0.3
  pollWeight: number;     // default 0.4
  discussionWeight: number; // default 0.2
}
export const polls: Poll[] = [ /* 5–6 seeded polls linked to existing ISS-* */ ];
export const discussions: DiscussionComment[] = [ /* 8–10 seeded comments */ ];
export const defaultAIWeights: AIWeights = { voteWeight: 0.3, pollWeight: 0.4, discussionWeight: 0.2 };
```

---

## 2. AI Priority Integration (`src/lib/ai-insights.ts`)

Extend `calcPriorityScore(issue, polls?, comments?, weights?)`:

```
priorityScore = baseAI
  + (votes * voteWeight)
  + (pollUrgencyPct * pollWeight)
  + (commentCount * discussionWeight)
```

Add helper `explainPriority(issue, polls, comments, weights)` returning a structured array of contributing factors for the **AI Explanation Panel**.

---

## 3. New Components

| File | Purpose |
|---|---|
| `src/components/dashboard/PollCard.tsx` | Vote buttons + percentage bars + result display |
| `src/components/dashboard/PollsSection.tsx` | Public polls list page |
| `src/components/dashboard/DiscussionsSection.tsx` | Public flat-comment list per issue, latest-first, with input |
| `src/components/dashboard/CommunityInsightsPanel.tsx` | Admin: votes/poll-results/comments per issue |
| `src/components/dashboard/AIWeightControls.tsx` | Admin sliders for vote/poll/discussion weights |
| `src/components/dashboard/PollManagementPanel.tsx` | Admin: create/disable/remove polls, view breakdown |
| `src/components/dashboard/DiscussionModerationPanel.tsx` | Admin: view all comments, delete |
| `src/components/dashboard/TrendingMonitor.tsx` | Top issues by engagement (votes+comments+poll activity) |
| `src/components/dashboard/AIExplanationPanel.tsx` | "High priority because X votes, Y% urgent poll, Z comments" |

Existing `IssueCard` and `IssueDetailDialog` already show upvotes — enhance the upvote button: highlight after click, append "N people affected" microcopy.

---

## 4. Public Dashboard (`src/pages/DashboardPublic.tsx`)

Add two sidebar sections: **Polls** and **Discussions**. Update `Section` type and `shellSidebarItems`.

Home section gains a **Trending Issues** strip (sorted by `upvotes + comments*2`).

```
Sidebar: Home | Issues | Polls | Discussions | Alerts | Map | Profile
```

State: `pollList`, `commentList` (initialized from mock, mutated locally). Handlers: `handlePollVote`, `handleAddComment`, `handleUpvote` (already exists).

---

## 5. Admin Dashboard (`src/pages/DashboardAdmin.tsx`)

Add three sidebar sections: **Polls**, **Discussions**, **Community Insights**.

- **Polls** → `PollManagementPanel` (create poll dialog linking to issue dropdown, toggle active, delete)
- **Discussions** → `DiscussionModerationPanel` (table of all comments + delete button)
- **Community Insights** → `CommunityInsightsPanel` + `AIWeightControls` + `TrendingMonitor` + `AIExplanationPanel` for selected issue
- **Issue Priority Override**: small High/Medium/Low selector on each row in the existing Issues section that mutates `issue.urgency` locally

---

## 6. UI / UX Conventions

- Reuse existing `Card`, `Button`, `Progress`, `Tabs`, `Dialog` primitives — no new dependencies.
- Match existing Apple-HIG visual identity (rounded-2xl, subtle shadows, framer-motion fade/slide).
- Polls: horizontal % bars with smooth width transitions on vote.
- Discussions: flat list, no nesting, newest-first, simple input + Post button.
- Toasts via existing `sonner` for vote/comment confirmations.

---

## Out of Scope

- No Supabase tables, edge functions, or migrations (mock-data only per requirements).
- No nested replies, threading, mentions, or rich text.
- No real-time sync — local state mutations only.

---

## Files Created / Modified

**Modified (4):** `src/data/mockData.ts`, `src/lib/ai-insights.ts`, `src/pages/DashboardPublic.tsx`, `src/pages/DashboardAdmin.tsx`, `src/components/IssueCard.tsx`, `src/components/dashboard/IssueDetailDialog.tsx`

**Created (9):** PollCard, PollsSection, DiscussionsSection, CommunityInsightsPanel, AIWeightControls, PollManagementPanel, DiscussionModerationPanel, TrendingMonitor, AIExplanationPanel
