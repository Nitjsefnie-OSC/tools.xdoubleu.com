import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import ShowArtwork from '@/components/podcasts/ShowArtwork'

describe('ShowArtwork', () => {
  it('shows the artwork', () => {
    const { container } = render(<ShowArtwork url="https://img.example/a.jpg" title="history" />)
    expect(screen.getByRole('presentation')).toHaveAttribute('src', 'https://img.example/a.jpg')
    expect(container.firstElementChild).toHaveStyle({ width: '64px', height: '64px' })
  })

  it('falls back to the initial without a URL', () => {
    render(<ShowArtwork url="" title="history" />)
    expect(screen.getByText('H')).toBeInTheDocument()
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument()
  })

  it('falls back to the initial when the image fails', () => {
    render(<ShowArtwork url="https://img.example/a.jpg" title="history" />)
    fireEvent.error(screen.getByRole('presentation'))
    expect(screen.getByText('H')).toBeInTheDocument()
  })
})
