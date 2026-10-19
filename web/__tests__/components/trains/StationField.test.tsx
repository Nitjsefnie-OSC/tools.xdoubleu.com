import { render, screen, fireEvent } from '@testing-library/react'
import StationField from '@/components/trains/StationField'

const mockUseStationSearch = vi.fn()
vi.mock('@/hooks/useTrains', () => ({
  useStationSearch: (query: string) => mockUseStationSearch(query)
}))

let capturedOnSelect: ((name: string) => void) | undefined
vi.mock('@/components/ui/combobox', () => ({
  Combobox: (props: {
    value: string
    onChange: (v: string) => void
    onSelect?: (name: string) => void
    id?: string
  }) => {
    capturedOnSelect = props.onSelect
    return (
      <input id={props.id} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    )
  }
}))

beforeEach(() => {
  mockUseStationSearch.mockReset()
  mockUseStationSearch.mockReturnValue({
    stations: [
      { stopId: 'SA', nameNl: 'Alpha', nameFr: 'Alpha', nameEn: 'Alpha', displayName: 'Alpha' },
      { stopId: 'SB', nameNl: 'Bravo', nameFr: 'Bravo', nameEn: 'Bravo', displayName: 'Bravo' }
    ]
  })
})

describe('StationField', () => {
  it('renders the label and current query', () => {
    render(
      <StationField
        label="From"
        query="Al"
        onQueryChange={vi.fn()}
        onSelectStation={vi.fn()}
        placeholder="Origin station"
      />
    )
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByLabelText('From')).toHaveValue('Al')
  })

  it('calls onQueryChange as the user types', () => {
    const onQueryChange = vi.fn()
    render(
      <StationField
        label="From"
        query=""
        onQueryChange={onQueryChange}
        onSelectStation={vi.fn()}
        placeholder="Origin station"
      />
    )
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Al' } })
    expect(onQueryChange).toHaveBeenCalledWith('Al')
  })

  it('resolves a selected suggestion to its stop id', () => {
    const onSelectStation = vi.fn()
    render(
      <StationField
        label="From"
        query="Al"
        onQueryChange={vi.fn()}
        onSelectStation={onSelectStation}
        placeholder="Origin station"
      />
    )
    capturedOnSelect?.('Alpha')
    expect(onSelectStation).toHaveBeenCalledWith('SA', 'Alpha')
  })

  it('shows the station display name computed server-side as its suggestion', () => {
    mockUseStationSearch.mockReturnValue({
      stations: [
        {
          stopId: 'SC',
          nameNl: 'Brussel-Zuid',
          nameFr: 'Bruxelles-Midi',
          nameEn: 'Brussels-South',
          displayName: 'Brussel-Zuid / Bruxelles-Midi / Brussels-South'
        }
      ]
    })
    const onSelectStation = vi.fn()
    render(
      <StationField
        label="From"
        query="Bru"
        onQueryChange={vi.fn()}
        onSelectStation={onSelectStation}
        placeholder="Origin station"
      />
    )
    capturedOnSelect?.('Brussel-Zuid / Bruxelles-Midi / Brussels-South')
    expect(onSelectStation).toHaveBeenCalledWith(
      'SC',
      'Brussel-Zuid / Bruxelles-Midi / Brussels-South'
    )
  })

  it('ignores a selection that does not match a known station', () => {
    const onSelectStation = vi.fn()
    render(
      <StationField
        label="From"
        query="Al"
        onQueryChange={vi.fn()}
        onSelectStation={onSelectStation}
        placeholder="Origin station"
      />
    )
    capturedOnSelect?.('Nowhere')
    expect(onSelectStation).not.toHaveBeenCalled()
  })
})
