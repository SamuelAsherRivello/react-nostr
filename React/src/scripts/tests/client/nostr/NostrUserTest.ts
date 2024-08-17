import { beforeAll, afterAll, beforeEach, afterEach, expect, test } from 'vitest';
import { NostrUser } from '../../../client/nostr/NostrUser';

beforeAll(() => {
  //console.log('NostrUserTest.beforeAll()');
});

beforeEach(() => {
  //console.log('NostrUserTest.beforeEach()');
});

afterEach(() => {
  //console.log('NostrUserTest.afterEach()');
});

afterAll(() => {
  //console.log('NostrUserTest.afterAll()');
});

test('publicKey, result is NOT empty, when default', () => {
  // Arrange
  let expected = '';
  let instance = new NostrUser();

  // Act
  let result = instance.publicKey;

  // Assert
  expect(result).not.toBe(expected);
});

test('publicKey, result is blah, when constructor takes blah', () => {
  // Arrange
  let expected = 'blah';
  let instance = new NostrUser(expected);

  // Act
  let result = instance.publicKey;

  // Assert
  expect(result).toBe(expected);
});

test('privateKey, result is NOT empty, when default', () => {
  // Arrange
  let instance = new NostrUser();

  // Act
  let result = instance.privateKey;

  // Assert
  expect(result).not.toBeNull();
  expect(result.length).toBeGreaterThan(0);
});

test('toString, result is valid JSON', () => {
  // Arrange
  let instance = new NostrUser();

  // Act
  let result = instance.toJsonString();

  // Assert
  expect(() => JSON.parse(result)).not.toThrow();
});

test('fromString, creates equivalent instance', () => {
  // Arrange
  let instance = new NostrUser();
  let stringified = instance.toJsonString();

  // Act
  let newInstance = NostrUser.fromJsonString(stringified);

  // Assert
  expect(newInstance.publicKey).toBe(instance.publicKey);
  expect(newInstance.privateKey).toEqual(instance.privateKey);
});
