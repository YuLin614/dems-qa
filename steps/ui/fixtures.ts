// steps/ui/fixtures.ts
import { test as base, createBdd } from 'playwright-bdd';

// Scenario-scoped state shared across steps
interface ScenarioState {
  recordId: string | null;
  fileId: string | null;
  shareUrl: string | null;
  lastResponse: { status: number; body: unknown } | null;
}

let state: ScenarioState = { recordId: null, fileId: null, shareUrl: null, lastResponse: null };

export const test = base.extend({});
export const { Given, When, Then, Before, After } = createBdd(test);

// Reset state before each scenario
Before(async function () {
  state = { recordId: null, fileId: null, shareUrl: null, lastResponse: null };
});

export { state };
