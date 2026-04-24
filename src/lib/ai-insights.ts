import type { Issue, Urgency, Category } from "@/data/mockData";
import type { Poll, DiscussionComment, AIWeights } from "@/data/mockData";
import { defaultAIWeights } from "@/data/mockData";

const urgencyValue: Record<Urgency, number> = { High: 9, Medium: 6, Low: 3 };

const categoryTravelTime: Partial<Record<Category, number>> = {
  Disaster: 25, Health: 15, Food: 20, Infrastructure: 20,
  Environment: 15, Safety: 10, Communication: 10, Shelter: 18,
};

const categoryTaskTime: Partial<Record<Category, [number, number]>> = {
  Disaster: [30, 60], Health: [20, 40], Food: [15, 30],
  Infrastructure: [20, 45], Environment: [10, 25], Safety: [10, 20],
  Communication: [10, 20], Shelter: [15, 30],
};

/**
 * Priority Score (0–100)
 * Formula: (severity×0.3 + population×0.25 + urgency×0.25 + locationRisk×0.1 + delayImpact×0.1) normalized
 */
export function calcPriorityScore(issue: Issue): number {
  const severity = urgencyValue[issue.severity ?? issue.urgency];
  const population = Math.min(10, Math.max(1, Math.ceil(issue.affectedPeople / 1000)));
  const urgency = urgencyValue[issue.urgency];
  const locationRisk = issue.locationRisk ?? 6;
  const delayImpact = issue.urgency === "High" ? 8 : issue.urgency === "Medium" ? 5 : 3;

  const raw = severity * 0.3 + population * 0.25 + urgency * 0.25 + locationRisk * 0.1 + delayImpact * 0.1;
  // Max possible raw = 9*0.3 + 10*0.25 + 9*0.25 + 10*0.1 + 10*0.1 = 2.7+2.5+2.25+1+1 = 9.45
  return Math.round(Math.min(100, (raw / 9.45) * 100));
}

/** Pull urgency signal (0-100) from a poll where the first option is the "urgent" one. */
export function pollUrgencyPercent(poll: Poll | undefined): number {
  if (!poll || poll.options.length === 0) return 0;
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  if (total === 0) return 0;
  // Heuristic: first option assumed to represent "urgent / yes"
  return Math.round((poll.options[0].votes / total) * 100);
}

/**
 * Community-weighted priority. Combines AI base with votes, poll urgency %, and comment activity.
 * Returns a 0–100 score.
 */
export function calcCommunityPriority(
  issue: Issue,
  polls: Poll[] = [],
  comments: DiscussionComment[] = [],
  weights: AIWeights = defaultAIWeights,
): number {
  const baseAI = calcPriorityScore(issue);
  const votes = Math.min(100, issue.upvotes); // cap influence
  const issuePoll = polls.find((p) => p.issueId === issue.id && p.active);
  const pollSignal = pollUrgencyPercent(issuePoll);
  const commentCount = Math.min(20, comments.filter((c) => c.issueId === issue.id).length);
  const commentSignal = (commentCount / 20) * 100;

  const score =
    baseAI * 0.5 +
    votes * weights.voteWeight +
    pollSignal * weights.pollWeight +
    commentSignal * weights.discussionWeight;

  return Math.round(Math.min(100, Math.max(0, score)));
}

export interface PriorityFactor {
  label: string;
  detail: string;
  contribution: number; // 0-100 contribution
}

/** Structured explanation for the AI Explanation Panel. */
export function explainPriority(
  issue: Issue,
  polls: Poll[] = [],
  comments: DiscussionComment[] = [],
  weights: AIWeights = defaultAIWeights,
): { score: number; factors: PriorityFactor[] } {
  const baseAI = calcPriorityScore(issue);
  const issuePoll = polls.find((p) => p.issueId === issue.id && p.active);
  const pollSignal = pollUrgencyPercent(issuePoll);
  const commentCount = comments.filter((c) => c.issueId === issue.id).length;

  const factors: PriorityFactor[] = [
    { label: "Base AI signal", detail: `Severity, population & risk → ${baseAI}/100`, contribution: Math.round(baseAI * 0.5) },
    { label: "Community votes", detail: `${issue.upvotes} upvotes`, contribution: Math.round(Math.min(100, issue.upvotes) * weights.voteWeight) },
    { label: "Poll urgency", detail: issuePoll ? `${pollSignal}% voted urgent (${issuePoll.question})` : "No active poll", contribution: Math.round(pollSignal * weights.pollWeight) },
    { label: "Discussion activity", detail: `${commentCount} comment${commentCount === 1 ? "" : "s"}`, contribution: Math.round((Math.min(20, commentCount) / 20) * 100 * weights.discussionWeight) },
  ];
  return { score: calcCommunityPriority(issue, polls, comments, weights), factors };
}

/**
 * Response Time = Travel Time + Task Time (in minutes)
 */
export function predictResponseTime(issue: Issue): number {
  const travel = categoryTravelTime[issue.category] ?? 15;
  const [min, max] = categoryTaskTime[issue.category] ?? [10, 20];
  // Deterministic midpoint based on affected people scale
  const factor = Math.min(1, issue.affectedPeople / 5000);
  return Math.round(travel + min + (max - min) * factor);
}

/**
 * Volunteers Required = ceil(affectedPeople / 20)
 */
export function estimateVolunteers(issue: Issue): number {
  return Math.max(1, Math.ceil(issue.affectedPeople / 20));
}

/**
 * NGO Requirement based on category + severity
 */
export function estimateNGOs(issue: Issue): number {
  const score = calcPriorityScore(issue);
  if (issue.category === "Disaster") return score >= 80 ? 3 : 2;
  if (issue.category === "Health") return 1;
  if (issue.category === "Food" || issue.category === "Shelter") return score >= 60 ? 2 : 1;
  return score >= 80 ? 3 : score >= 50 ? 2 : 1;
}

/**
 * Smart suggestion text based on priority score
 */
export function generateSuggestion(issue: Issue): string {
  const score = calcPriorityScore(issue);
  const vols = estimateVolunteers(issue);
  const ngos = estimateNGOs(issue);
  const responseTime = predictResponseTime(issue);

  if (score >= 80) {
    return `🚨 Immediate action required — Deploy ${vols} volunteers and coordinate ${ngos} NGOs now. Est. response: ${responseTime} min.`;
  }
  if (score >= 50) {
    return `⚠️ Urgent — Assign ${vols} volunteers within 1 hour. Engage ${ngos} NGO(s). Est. response: ${responseTime} min.`;
  }
  return `✅ Low priority — Schedule ${vols} volunteer(s) for next shift. ${ngos} NGO sufficient. Est. response: ${responseTime} min.`;
}

/**
 * Full AI insights for an issue
 */
export function getAIInsights(issue: Issue) {
  return {
    priorityScore: calcPriorityScore(issue),
    responseTime: predictResponseTime(issue),
    volunteersRequired: estimateVolunteers(issue),
    ngosRequired: estimateNGOs(issue),
    suggestion: generateSuggestion(issue),
    urgencyLabel: issue.urgency,
  };
}
