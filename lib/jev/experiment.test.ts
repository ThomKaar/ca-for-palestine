import assert from 'node:assert/strict';
import test from 'node:test';
import { assignFormFillVariant } from './experiment';

function withExperiment(callback: () => void) {
  const previous = { ...process.env };
  process.env.JEV_FORM_EXPERIMENT_ENABLED = 'true';
  process.env.JEV_FORM_RUNNER_URL = 'https://runner.example.test';
  process.env.JEV_FORM_RUNNER_TOKEN = 'secret';
  process.env.JEV_FORM_EXPERIMENT_SALT = 'test-salt';
  try {
    callback();
  } finally {
    process.env = previous;
  }
}

test('assignment is stable for the same user', () => {
  withExperiment(() => {
    assert.equal(assignFormFillVariant('Person@Example.com'), assignFormFillVariant('person@example.com'));
  });
});

test('experiment can force either arm', () => {
  withExperiment(() => {
    process.env.JEV_FORM_TREATMENT_PERCENT = '100';
    assert.equal(assignFormFillVariant('person@example.com'), 'jev_ultrafast');
    process.env.JEV_FORM_TREATMENT_PERCENT = '0';
    assert.equal(assignFormFillVariant('person@example.com'), 'legacy');
  });
});

test('experiment remains on legacy when the runner is unavailable', () => {
  const previous = process.env.JEV_FORM_EXPERIMENT_ENABLED;
  delete process.env.JEV_FORM_EXPERIMENT_ENABLED;
  try {
    assert.equal(assignFormFillVariant('person@example.com'), 'legacy');
  } finally {
    if (previous === undefined) delete process.env.JEV_FORM_EXPERIMENT_ENABLED;
    else process.env.JEV_FORM_EXPERIMENT_ENABLED = previous;
  }
});
