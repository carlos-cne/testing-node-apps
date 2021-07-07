import {isPasswordAllowed} from '../auth'
// Testing Pure Functions

// valid:
// - !aBc123
//
// invalid:
// - a2c! // too short
// - 123456! // no alphabet characters
// - ABCdef! // no numbers
// - abc123! // no uppercase letters
// - ABC123! // no lowercase letters
// - ABCdef123 // no non-alphanumeric characters
const validPassword = ['!aBc123']
const noValidPasswords = [
  'a2c!',
  '123456!',
  'ABCdef!',
  'abc123!',
  'ABC123!',
  'ABCdef123',
]

test.each(validPassword)('%s - isPasswordAllowed', (password) => {
  expect(isPasswordAllowed(password)).toBe(true)
})

test.each(noValidPasswords)('%s - is not allowed', (password) => {
  expect(isPasswordAllowed(password)).toBe(false)
})
