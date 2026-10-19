import { render, screen, fireEvent, act } from '@testing-library/react'
import ViewerClient from '@/app/watchparty/[id]/ViewerClient'
import PresenterClient from '@/app/watchparty/[id]/presenter/PresenterClient'

interface HookArgs {
  role: string
  onSharingChange?: (sharing: boolean) => void
  screenControls?: { current: { start: () => Promise<void>; stop: () => void } }
}

let lastArgs: HookArgs | undefined
let mockStatus = 'connected'
vi.mock('@/hooks/useWatchPartyRTC', () => ({
  useWatchPartyRTC: (args: HookArgs) => {
    lastArgs = args
    return {
      status: mockStatus,
      micEnabled: true,
      camEnabled: true,
      selfCamVisible: true,
      error: null,
      toggleMic: vi.fn(),
      toggleCam: vi.fn(),
      toggleSelfCam: vi.fn()
    }
  }
}))

vi.mock('@/lib/watchparty/roomUtils', () => ({
  attachDraggable: () => () => {}
}))

beforeEach(() => {
  lastArgs = undefined
  mockStatus = 'connected'
})

describe('ViewerClient', () => {
  it('joins as a viewer and renders the room', () => {
    render(<ViewerClient id="ROOM1" />)
    expect(lastArgs?.role).toBe('viewer')
    expect(screen.getByText('Room: ROOM1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Share Screen' })).not.toBeInTheDocument()
  })
})

describe('PresenterClient', () => {
  it('starts and stops screen sharing', () => {
    render(<PresenterClient id="ROOM2" />)
    expect(lastArgs?.role).toBe('presenter')
    const start = vi.fn(() => Promise.resolve())
    const stop = vi.fn()
    lastArgs!.screenControls!.current = { start, stop }

    fireEvent.click(screen.getByRole('button', { name: 'Share Screen' }))
    expect(start).toHaveBeenCalled()

    act(() => lastArgs!.onSharingChange!(true))
    fireEvent.click(screen.getByRole('button', { name: 'Stop Sharing' }))
    expect(stop).toHaveBeenCalled()
  })

  it('disables sharing until connected', () => {
    mockStatus = 'connecting'
    render(<PresenterClient id="ROOM3" />)
    expect(screen.getByRole('button', { name: 'Share Screen' })).toBeDisabled()
  })
})
