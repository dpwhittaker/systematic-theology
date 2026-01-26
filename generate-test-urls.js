#!/usr/bin/env node

/**
 * Generate Test URLs for Tasker Automation
 *
 * This script generates a list of URLs to test with Tasker.
 * Output can be used in Tasker tasks or for manual testing.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const OUTPUT_FILE = 'tasker-test-urls.txt';

// Test scenarios
const testScenarios = [
  {
    name: 'Initial Load',
    url: `${BASE_URL}`,
    description: 'Default entry point - intro page',
    expectedLinks: ['Hebrew (yellow)', 'Greek (cyan)', 'Drill (green)'],
    screenshot: 'hud_01_initial.png'
  },
  {
    name: 'Intro Overview',
    url: `${BASE_URL}#intro/intro`,
    description: 'Main introduction page',
    expectedLinks: ['philosophy', 'narrative', 'relation', 'wrestling'],
    screenshot: 'hud_02_intro.png'
  },
  {
    name: 'Hebrew Narrative',
    url: `${BASE_URL}#intro/narrative`,
    description: 'Hebrew narrative approach',
    expectedLinks: ['Parent to intro', 'Other Hebrew concepts'],
    screenshot: 'hud_03_narrative.png'
  },
  {
    name: 'Greek Philosophy',
    url: `${BASE_URL}#intro/philosophy`,
    description: 'Greek philosophical approach',
    expectedLinks: ['Parent to intro', 'Other Greek concepts'],
    screenshot: 'hud_04_philosophy.png'
  },
  {
    name: 'Hebrew Relation',
    url: `${BASE_URL}#intro/relation`,
    description: 'Hebrew relational approach',
    expectedLinks: ['covenant', 'relationship'],
    screenshot: 'hud_05_relation.png'
  },
  {
    name: 'Hebrew Wrestling',
    url: `${BASE_URL}#intro/wrestling`,
    description: 'Hebrew interpretive method',
    expectedLinks: ['hagah', 'meditation'],
    screenshot: 'hud_06_wrestling.png'
  },
  {
    name: 'God Category',
    url: `${BASE_URL}#god/god`,
    description: 'Theology Proper - main category page',
    expectedLinks: ['essence', 'names', 'attributes'],
    screenshot: 'hud_07_god.png'
  },
  {
    name: 'Christ Category',
    url: `${BASE_URL}#jesus/jesus`,
    description: 'Christology - main category page',
    expectedLinks: ['incarnation', 'atonement', 'resurrection'],
    screenshot: 'hud_08_jesus.png'
  },
  {
    name: 'Salvation Category',
    url: `${BASE_URL}#salvation/salvation`,
    description: 'Soteriology - main category page',
    expectedLinks: ['grace', 'faith', 'justification'],
    screenshot: 'hud_09_salvation.png'
  },
  {
    name: 'Church Category',
    url: `${BASE_URL}#church/church`,
    description: 'Ecclesiology - main category page',
    expectedLinks: ['nature', 'ordinances', 'mission'],
    screenshot: 'hud_10_church.png'
  },
  {
    name: 'Spirit Category',
    url: `${BASE_URL}#spirit/spirit`,
    description: 'Pneumatology - main category page',
    expectedLinks: ['person', 'work', 'gifts'],
    screenshot: 'hud_11_spirit.png'
  },
  {
    name: 'End Times Category',
    url: `${BASE_URL}#eschatology/eschatology`,
    description: 'Eschatology - main category page',
    expectedLinks: ['return', 'resurrection', 'judgment'],
    screenshot: 'hud_12_eschatology.png'
  }
];

// Generate plain text output
function generateTextOutput() {
  let output = '# HUD Interface Test URLs\n\n';
  output += '# Generated: ' + new Date().toISOString() + '\n';
  output += '# Base URL: ' + BASE_URL + '\n';
  output += '# Note: Start local server with: python3 -m http.server 8080\n\n';

  testScenarios.forEach((scenario, index) => {
    output += `## Test ${index + 1}: ${scenario.name}\n`;
    output += `URL: ${scenario.url}\n`;
    output += `Description: ${scenario.description}\n`;
    output += `Expected: ${scenario.expectedLinks.join(', ')}\n`;
    output += `Screenshot: ${scenario.screenshot}\n\n`;
  });

  return output;
}

// Generate JSON for programmatic use
function generateJsonOutput() {
  return JSON.stringify({
    baseUrl: BASE_URL,
    generated: new Date().toISOString(),
    scenarios: testScenarios
  }, null, 2);
}

// Generate Tasker-friendly format
function generateTaskerFormat() {
  let output = '# Tasker Task Actions (Copy/Paste)\n\n';

  testScenarios.forEach((scenario, index) => {
    output += `# Test ${index + 1}: ${scenario.name}\n`;
    output += `A1: Browse URL [ URL:${scenario.url} ]\n`;
    output += `A2: Wait [ Seconds:2 ]\n`;
    output += `A3: Take Screenshot [ Name:${scenario.screenshot.replace('.png', '')} ]\n`;
    output += `A4: Wait [ Seconds:1 ]\n\n`;
  });

  return output;
}

// Main execution
console.log('Generating test URLs...\n');

// Write text format
const textOutput = generateTextOutput();
fs.writeFileSync(OUTPUT_FILE, textOutput);
console.log(`✓ Text format: ${OUTPUT_FILE}`);

// Write JSON format
const jsonOutput = generateJsonOutput();
fs.writeFileSync('tasker-test-urls.json', jsonOutput);
console.log('✓ JSON format: tasker-test-urls.json');

// Write Tasker format
const taskerOutput = generateTaskerFormat();
fs.writeFileSync('tasker-actions.txt', taskerOutput);
console.log('✓ Tasker format: tasker-actions.txt');

console.log('\nTest scenarios generated:');
testScenarios.forEach((scenario, index) => {
  console.log(`  ${index + 1}. ${scenario.name}`);
});

console.log('\n✓ All test URL files generated!');
console.log('\nUsage:');
console.log('  1. Start server: python3 -m http.server 8080');
console.log('  2. Open Tasker and create new task');
console.log('  3. Copy actions from tasker-actions.txt');
console.log('  4. Run task and verify screenshots');
