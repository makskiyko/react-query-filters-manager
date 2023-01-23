# react-query-filters-manager [![NPM Module](https://img.shields.io/npm/v/form-data.svg)](https://www.npmjs.com/package/react-query-filters-manager)

A library for management your data in project.

The storing and updating data depend on [@tanstack/react-query](https://react-query-v3.tanstack.com/).

## Requirements

This package has the following peer dependencies:

- [React](https://reactjs.org/) v18.2.0+
- [Next](https://nextjs.org/) v13.0.7+
- [@tanstack/react-query](https://react-query-v3.tanstack.com/) v4.22.3+

## Install
```
npm i react-query-filters-manager
```

## Principle of working
1) Data is collected using `useQuery` + `getFiltersValues`.
   Filters are taken from the request parameters, or, if they have not yet been applied to the page, from `initialFilters`.
2) To update the filter, use `setFilters`, that call `handleSetFiltersInUrl`.
   It updates the data using `setFiltersValues` , then `queryClient.invalidateQueries` happens
   by the key `filterKey`, and writing a new history in the URL.
3) To save filters in the URL as query parameters. Using `queryString.stringify` the object is converted to a string
   request parameters. Next, the incoming URL is added using the `router.replace` method.
4) To reset the recovery data, `handleChange`, which repeats 2 step with the initial data.
5) When filters are changed, the method for obtaining data is called.

## Usage
Here is a very basic example of how to use Next Router Guards.
1. Wrap your project into `FiltersManagerContextProvider` in _app.tsx.
2. Create you hook that return `UseFiltersState`.
3. Call `useFilters` and pass generic parameters:
    - `TData` - type of the management data (required);
    - `TFilters` - type of filters that affect on your data (required);
    - `TFiltersPrepared` - type of data that will be caching in url of page;
    - `TVariants` - type of variants your filter's data.
4. Pass needed params to `useFilters`.

Example:
```tsx
// /pages/_app.tsx

import {FiltersManagerContextProvider} from 'react-query-filters-manager';

function MyApp({pageProps}: AppProps) {
  const queryClient = useMemo<QueryClient>(() => new QueryClient(), []);
  
  return (
    <>
      <Head>
         ...
      </Head>

      <QueryClientProvider client={queryClient}>
        <FiltersManagerContextProvider queryClient={queryClient}>
          ...
        </FiltersManagerContextProvider>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;
```

```ts
// cart_filters.service.ts

import {useFilters, type UseFiltersState} from 'react-query-filters-manager';

export const useCartFilters = (): UseFiltersState<CartModel, CartFiltersModel> => {
  const initialFilters = useMemo<CartFiltersModel>(
    () => ({
      page: 1,
      perPage: DEFAULT_PAGINATION_STEP,
      sortBy: null,
      sortDirection: 'asc',
    }),
    [],
  );

  const queryParser = useCallback(
    (queries: ParsedQuery): CartFiltersModel => ({
      page: parseNumberHelper(queries.page, 1),
      perPage: parseNumberHelper(queries.perPage, 50),
      sortBy: parseStringHelper(queries.sortBy, null) as CartFiltersModel['sortBy'],
      sortDirection: parseStringHelper(queries.sortDirection, 'asc') as SortDirectionModel,
    }),
    [],
  );

  const getCartFiltersValues = useCallback(async () => getFiltersValuesLocal<CartFiltersModel>(cartKey), []);
  const setCartFiltersValues = useCallback(
    async (data: CartFiltersModel) => setFiltersValuesLocal<CartFiltersModel>({filtersKey: cartKey, filters: data}),
    [],
  );

  return useFilters<CartModel, CartFiltersModel>({
    filtersKey: cartKey,
    getData: getCartByFiltersApi,
    initialFilters,
    queryParser,
    getFiltersValues: getCartFiltersValues,
    setFiltersValues: setCartFiltersValues,
  });
};
```

## State
The `useFilters` return methods and parameters:
```ts
export type UseFiltersState<TData, TFilters, TVariants = void> = {
  // Count of applied filters.
  appliedFiltersCount: number;

  // Initial state of filters.
  initialFilters: TFilters;

  // The current state of the filters.
  filters: UseQueryResult<TFilters, ErrorModel>;

  // Data received from a filter.
  values: UseQueryResult<TData, ErrorModel>;

  // Filter value options.
  variants: UseQueryResult<TVariants | null, ErrorModel>;

  // Filter update.
  setFilters: UseMutationResult<TFilters, any, TFilters>;

  // Reset filters with the ability to change the field.
  resetFilters: UseMutationResult<TFilters, any, void | ResetFilterCallback<TFilters>>;
};
```

## Parameters
For use `useFilters` you need to pass parameters:
```ts
type Props<TData, TFilters, TFiltersPrepared = TFilters, TVariants = void> = {
  // The key by which the data will be updated.
  filtersKey: string;

  // Initial state of filters.
  initialFilters: TFilters;

  // Getting data by filters.
  getData: (params: TFilters) => Promise<TData>;

  // Convert query params to filter object.
  queryParser: (query: ParsedQuery) => TFilters;

  // Getting filters.
  getFiltersValues: () => Promise<TFilters | undefined>;

  // Update filters.
  setFiltersValues: (data: TFilters) => Promise<TFilters>;

  // Preparing data for entering it into query params.
  queryTransformer?: (data: TFilters) => TFiltersPrepared;

  // Getting count of applied filters.
  getAppliedFiltersCount?: (params: TFilters) => number;

  // Getting filter options.
  getVariants?: () => Promise<TVariants>;

  // Options for retrieving data.
  valuesOptions?: Omit<UseQueryOptions<TData, ErrorModel, TData>, 'queryKey' | 'queryFn' | 'initialData'> & {
    initialData?: () => undefined;
  };
};
```

## License
`react-query-filters-manager` is released under the [MIT](License) license.