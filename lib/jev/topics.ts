export const MESSAGE_TOPICS = {
  palestine_ceasefire: 'Calls for a ceasefire, permanent end to hostilities, or de-escalation in Gaza or Palestine.',
  palestine_humanitarian_aid: 'Calls for food, medicine, reconstruction, humanitarian access, or relief for Palestinians.',
  palestine_arms_embargo: 'Calls to stop, condition, or restrict weapons, military aid, or military funding to Israel.',
  palestine_rights_and_self_determination: 'Discusses Palestinian freedom, equal rights, liberation, sovereignty, or self-determination.',
  palestine_occupation_and_settlements: 'Discusses occupation, annexation, settlements, displacement, the West Bank, or East Jerusalem.',
  palestine_international_law_and_accountability: 'Calls for human-rights, war-crimes, genocide, or international-law accountability.',
  palestine_boycott_divestment_sanctions: 'Advocates boycott, divestment, sanctions, or institutional financial pressure related to Israel or Palestine.',
  left_anti_imperialism: 'Frames the issue through anti-imperialism, anti-colonialism, militarism, or opposition to empire.',
  left_economic_justice: 'Discusses class inequality, wealth redistribution, capitalism, corporate power, or redirecting military spending to human needs.',
  left_labor_and_worker_power: 'Discusses unions, organized labor, strikes, worker ownership, worker protections, or workplace democracy.',
  left_public_goods_and_social_welfare: 'Advocates universal or publicly funded healthcare, housing, education, transit, childcare, or other public goods.',
  left_racial_and_social_justice: 'Connects the message to racial justice, policing, prisons, immigration, disability justice, gender justice, or other liberation movements.',
  left_climate_justice: 'Discusses climate justice, environmental justice, fossil fuels, a just transition, or a Green New Deal.',
} as const;

export type MessageTopic = keyof typeof MESSAGE_TOPICS;

export interface TopicScore {
  topic: MessageTopic;
  probability: number;
  tagged: boolean;
}

export interface TopicTaggingResult {
  tags: MessageTopic[];
  scores: TopicScore[];
  model: string;
  threshold: number;
}

interface NoulAnswer {
  type?: string;
  noul?: number;
}

interface JevResponse {
  model?: string;
  answers?: Record<string, NoulAnswer>;
}

function configuredThreshold(): number {
  const value = Number(process.env.JEV_TOPIC_THRESHOLD ?? '0.65');
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.65;
}

export function topicQuestions() {
  return Object.fromEntries(
    Object.entries(MESSAGE_TOPICS).map(([topic, description]) => [
      topic,
      {
        type: 'noul',
        instructions: `Does the constituent's message substantially discuss this topic: ${description}`,
        criteria: {
          yes: 'The topic is explicit or is a clear substantive part of the request.',
          no: 'The topic is absent, merely incidental, or cannot be inferred from the text.',
        },
      },
    ]),
  );
}

export async function tagMessageTopics(message: string): Promise<TopicTaggingResult> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) throw new Error('TYPESAFE_API_KEY is not configured');

  const model = process.env.JEV_TOPIC_MODEL?.trim() || 'jev-latest';
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      state: message.slice(0, 12_000),
      questions: topicQuestions(),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Jev topic tagging returned HTTP ${response.status}`);
  }

  const result = await response.json() as JevResponse;
  const threshold = configuredThreshold();
  const scores = (Object.keys(MESSAGE_TOPICS) as MessageTopic[]).map((topic) => {
    const probability = result.answers?.[topic]?.noul;
    if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new Error(`Jev returned an invalid probability for ${topic}`);
    }
    return { topic, probability, tagged: probability >= threshold };
  });

  return {
    tags: scores.filter(({ tagged }) => tagged).map(({ topic }) => topic),
    scores,
    model: result.model || model,
    threshold,
  };
}
