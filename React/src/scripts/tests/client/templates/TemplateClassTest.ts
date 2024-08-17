import { beforeAll, afterAll, beforeEach, afterEach, expect, test } from 'vitest';
import '@testing-library/jest-dom';


beforeAll(() => {
  //console.log('TemplateClassTest.beforeAll()');
});

beforeEach(() => {
  //console.log('TemplateClassTest.beforeEach()');
});

afterEach(() => {
  //console.log('TemplateClassTest.afterEach()');
});

afterAll(() => {
  //console.log('TemplateClassTest.afterAll()');
});

test('instance is not null when default', () => {
  // Arrange
  let expected = true;

  // Act
  let result = true

  // Assert
  expect(result).toBe(expected);
});

