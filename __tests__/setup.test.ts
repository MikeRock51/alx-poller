/**
 * Basic test to verify Jest setup is working correctly
 */
describe('Test Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to jest globals', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })

  it('should have access to testing library matchers', () => {
    // This will fail if @testing-library/jest-dom is not properly set up
    const element = document.createElement('div')
    element.textContent = 'test'
    document.body.appendChild(element)
    expect(element).toBeInTheDocument()
    document.body.removeChild(element)
  })
})
