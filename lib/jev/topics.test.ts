import assert from 'node:assert/strict';
import test from 'node:test';
import { MESSAGE_TOPICS, tagMessageTopics, topicQuestions } from './topics';

test('every bounded topic becomes one independent Jev noul question', () => {
  const questions = topicQuestions();
  assert.deepEqual(Object.keys(questions), Object.keys(MESSAGE_TOPICS));
  for (const question of Object.values(questions)) {
    assert.equal(question.type, 'noul');
    assert.match(question.instructions, /constituent's message/);
  }
});

test('tagging applies the configured probability threshold', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.TYPESAFE_API_KEY;
  const previousThreshold = process.env.JEV_TOPIC_THRESHOLD;
  const [firstTopic] = Object.keys(MESSAGE_TOPICS);
  process.env.TYPESAFE_API_KEY = 'test-key';
  process.env.JEV_TOPIC_THRESHOLD = '0.7';
  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body));
    assert.deepEqual(Object.keys(request.questions), Object.keys(MESSAGE_TOPICS));
    return new Response(JSON.stringify({
      model: 'jev-test',
      answers: Object.fromEntries(
        Object.keys(MESSAGE_TOPICS).map((topic) => [topic, { type: 'noul', noul: topic === firstTopic ? 0.9 : 0.1 }]),
      ),
    }));
  };

  try {
    const result = await tagMessageTopics('Please support a ceasefire.');
    assert.deepEqual(result.tags, [firstTopic]);
    assert.equal(result.threshold, 0.7);
    assert.equal(result.model, 'jev-test');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = previousKey;
    if (previousThreshold === undefined) delete process.env.JEV_TOPIC_THRESHOLD;
    else process.env.JEV_TOPIC_THRESHOLD = previousThreshold;
  }
});
