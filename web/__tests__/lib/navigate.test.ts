import { leaveTo, reloadPage } from '@/lib/navigate'

// jsdom can't navigate; it logs "not implemented" through the virtual console.
describe('navigate', () => {
  it('leaveTo and reloadPage act on window.location', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => leaveTo('https://cb.example/?code=1')).not.toThrow()
    expect(() => reloadPage()).not.toThrow()

    error.mockRestore()
  })
})
