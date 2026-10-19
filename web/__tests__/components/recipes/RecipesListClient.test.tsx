import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: vi.fn(),
  useFetchRecipesPage: vi.fn(() => vi.fn())
}))

import RecipesListClient from '@/components/recipes/RecipesListClient'
import { useRecipes } from '@/hooks/useRecipes'
import { create } from '@bufbuild/protobuf'
import { RecipeSchema, ListRecipesResponseSchema } from '@/lib/gen/recipes/v1/recipes_pb'
import type { ListRecipesResponse } from '@/lib/gen/recipes/v1/recipes_pb'

function mockRecipes(value: { data?: ListRecipesResponse; error?: Error; isLoading: boolean }) {
  vi.mocked(useRecipes).mockReturnValue({
    data: value.data,
    error: value.error,
    isLoading: value.isLoading,
    isValidating: false,
    mutate: vi.fn(async () => undefined)
  })
}

beforeEach(() => vi.clearAllMocks())

describe('RecipesListClient', () => {
  it('shows a loading state', () => {
    mockRecipes({ isLoading: true })
    render(<RecipesListClient />)
    expect(screen.getByText('Loading recipes…')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    mockRecipes({ error: new Error('boom'), isLoading: false })
    render(<RecipesListClient />)
    expect(screen.getByText('Failed to load recipes.')).toBeInTheDocument()
  })

  it('renders recipe cards', () => {
    mockRecipes({
      data: create(ListRecipesResponseSchema, {
        recipes: [create(RecipeSchema, { id: 'r1', name: 'Pasta', baseServings: 2 })]
      }),
      isLoading: false
    })
    render(<RecipesListClient />)
    expect(screen.getByRole('link', { name: /Pasta/ })).toHaveAttribute('href', '/recipes/r1')
  })

  it('marks draft recipes with a badge and leaves proven ones unmarked', () => {
    mockRecipes({
      data: create(ListRecipesResponseSchema, {
        recipes: [
          create(RecipeSchema, { id: 'r1', name: 'Proven', baseServings: 2 }),
          create(RecipeSchema, { id: 'r2', name: 'Untested', baseServings: 2, isDraft: true })
        ]
      }),
      isLoading: false
    })
    render(<RecipesListClient />)
    expect(screen.getByRole('link', { name: /Untested/ })).toHaveTextContent('Draft')
    expect(screen.getByRole('link', { name: /Proven/ })).not.toHaveTextContent('Draft')
  })
})
