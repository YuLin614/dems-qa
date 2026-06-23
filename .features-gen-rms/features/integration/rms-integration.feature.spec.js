// Generated from: features\integration\rms-integration.feature
import { test } from "../../../steps/rms/fixtures.ts";

test.describe('RMS to DEMS integration', () => {

  test('Open DEMS integration mode from RMS record', { tag: ['@rms'] }, async ({ Given, When, Then, And, context, page }) => { 
    await Given('I am on the RMS site', null, { page }); 
    await When('I navigate to record "PP 2026-12300" via Quick Launch Recent', null, { page }); 
    await And('I click Digital Evidence', null, { page }); 
    await Then('DEMS opens in a new tab in integration mode', null, { context }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\integration\\rms-integration.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":4,"tags":["@rms"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"Given I am on the RMS site","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":6,"keywordType":"Action","textWithKeyword":"When I navigate to record \"PP 2026-12300\" via Quick Launch Recent","stepMatchArguments":[{"group":{"start":21,"value":"\"PP 2026-12300\"","children":[{"start":22,"value":"PP 2026-12300","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"And I click Digital Evidence","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then DEMS opens in a new tab in integration mode","stepMatchArguments":[]}]},
]; // bdd-data-end