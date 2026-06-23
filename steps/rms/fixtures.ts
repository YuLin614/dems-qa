import { test as base, createBdd } from 'playwright-bdd';
import type { Page } from '@playwright/test';

let _demsPage: Page | null = null;

export const test = base.extend({});
export const { Given, When, Then, Before } = createBdd(test);

export function getDemsPage(): Page {
  if (!_demsPage) throw new Error('DEMS page not initialised — did the Background step run?');
  return _demsPage;
}

export function setDemsPage(p: Page): void {
  _demsPage = p;
}

Before(async function () {
  _demsPage = null;
});
