import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Search from '../pages/Search';
import { SearchContextProvider } from '../contexts/SearchContext';

describe('Search Component', () => {
  beforeEach(() => {
    render(
      <SearchContextProvider>
        <Search />
      </SearchContextProvider>
    );
  });

  test('renders search bar', () => {
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('displays search results when a query is entered', () => {
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Assuming the search function is mocked to return results
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    const results = screen.getByText(/results for "test"/i);
    expect(results).toBeInTheDocument();
  });

  test('shows no results message when no matches are found', () => {
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    const noResultsMessage = screen.getByText(/no results found/i);
    expect(noResultsMessage).toBeInTheDocument();
  });

  test('allows filtering search results', () => {
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);

    const filterOption = screen.getByText(/notes/i);
    fireEvent.click(filterOption);

    const results = screen.getByText(/filtered results for "test"/i);
    expect(results).toBeInTheDocument();
  });
});