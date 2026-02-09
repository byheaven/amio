import { setJestCucumberConfiguration } from 'jest-cucumber';

setJestCucumberConfiguration({
  scenarioNameTemplate: (vars) => `${vars.featureTitle} > ${vars.scenarioTitle}`,
  errors: {
    missingScenarioInStepDefinitions: true,
    missingStepInStepDefinitions: true,
    missingScenarioInFeature: true,
    missingStepInFeature: true,
  },
});
