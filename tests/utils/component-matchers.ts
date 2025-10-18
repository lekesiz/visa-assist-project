import { MatcherFunction } from '@testing-library/react'

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleName(expected: string): R
      toBeVisuallyHidden(): R
      toHaveProgressValue(expected: number): R
      toHaveValidDateFormat(): R
    }
  }
}

// Custom matcher for accessible names
export const toHaveAccessibleName: MatcherFunction = function (received, expected) {
  const element = received as HTMLElement
  
  const accessibleName = 
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.textContent?.trim() ||
    element.getAttribute('title') ||
    ''
  
  const pass = accessibleName === expected
  
  return {
    message: () =>
      pass
        ? `Expected element not to have accessible name "${expected}"`
        : `Expected element to have accessible name "${expected}", but got "${accessibleName}"`,
    pass,
  }
}

// Custom matcher for visually hidden elements
export const toBeVisuallyHidden: MatcherFunction = function (received) {
  const element = received as HTMLElement
  const styles = window.getComputedStyle(element)
  
  const isHidden = 
    styles.display === 'none' ||
    styles.visibility === 'hidden' ||
    styles.opacity === '0' ||
    element.hidden ||
    element.getAttribute('aria-hidden') === 'true'
  
  return {
    message: () =>
      isHidden
        ? 'Expected element to be visible'
        : 'Expected element to be visually hidden',
    pass: isHidden,
  }
}

// Custom matcher for progress bar values
export const toHaveProgressValue: MatcherFunction = function (received, expected) {
  const element = received as HTMLElement
  
  // Check for aria-valuenow or style width
  const ariaValue = element.getAttribute('aria-valuenow')
  const styleWidth = element.style.width
  
  let actualValue: number | null = null
  
  if (ariaValue) {
    actualValue = parseInt(ariaValue, 10)
  } else if (styleWidth && styleWidth.includes('%')) {
    actualValue = parseInt(styleWidth.replace('%', ''), 10)
  }
  
  const pass = actualValue === expected
  
  return {
    message: () =>
      pass
        ? `Expected element not to have progress value ${expected}`
        : `Expected element to have progress value ${expected}, but got ${actualValue}`,
    pass,
  }
}

// Custom matcher for valid date formats
export const toHaveValidDateFormat: MatcherFunction = function (received) {
  const element = received as HTMLElement
  const text = element.textContent?.trim() || ''
  
  // Common date patterns
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\w{3}\s\d{1,2},\s\d{4}$/, // Jan 1, 2024
  ]
  
  const isValidDate = datePatterns.some(pattern => pattern.test(text)) && !isNaN(Date.parse(text))
  
  return {
    message: () =>
      isValidDate
        ? `Expected "${text}" not to be a valid date format`
        : `Expected "${text}" to be a valid date format`,
    pass: isValidDate,
  }
}

// Register all custom matchers
expect.extend({
  toHaveAccessibleName,
  toBeVisuallyHidden,
  toHaveProgressValue,
  toHaveValidDateFormat,
})