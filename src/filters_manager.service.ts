import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {UseMutationResult, UseQueryResult, UseQueryOptions} from '@tanstack/react-query/src/types';
import {useRouter} from 'next/router';
import {parseUrl, stringify} from 'query-string/base';
import type {ParsedQuery, StringifyOptions} from 'query-string';
import {useEffect, useMemo, useState} from 'react';

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
  valuesOptions?: Omit<UseQueryOptions<TData, any, TData>, 'queryKey' | 'queryFn' | 'initialData'> & {
    initialData?: () => undefined;
  };
};

type ResetFilterCallback<TFilters> = (initialFilters: TFilters) => TFilters;

export type UseFiltersState<TData, TFilters, TVariants = void> = {
  // Count of applied filters.
  appliedFiltersCount: number;

  // Initial state of filters.
  initialFilters: TFilters;

  // The current state of the filters.
  filters: UseQueryResult<TFilters, any>;

  // Data received from a filter.
  values: UseQueryResult<TData, any>;

  // Filter value options.
  variants: UseQueryResult<TVariants | null, any>;

  // Filter update.
  setFilters: UseMutationResult<TFilters, any, TFilters>;

  // Reset filters with the ability to change the field.
  resetFilters: UseMutationResult<TFilters, any, void | ResetFilterCallback<TFilters>>;
};

/**
 * Using for storing, updating data and saving filters in  URL.
 *
 * `TData` - type of the management data (required);
 * `TFilters` - type of filters that affect on your data (required);
 * `TFiltersPrepared` - type of data that will be caching in url of page;
 * `TVariants` - type of variants your filter's data.
 *
 * Principle of working:
 * 1) Data is collected using `useQuery` + `getFiltersValues`.
 *    Filters are taken from the request parameters, or, if they have not yet been applied to the page, from `initialFilters`.
 * 2) To update the filter, use `setFilters`, that call `handleSetFiltersInUrl`.
 *    It updates the data using `setFiltersValues` , then `queryClient.invalidateQueries` happens
 *    by the key `filterKey`, and writing a new history in the URL.
 * 3) To save filters in the URL as query parameters. Using `queryString.stringify` the object is converted to a string
 *    request parameters. Next, the incoming URL is added using the `router.replace` method.
 * 4) To reset the recovery data, `handleChange`, which repeats 2 step with the initial data.
 * 5) When filters are changed, the method for obtaining data is called.
 */
export const useFilters = <TData extends any, TFilters extends {}, TFiltersPrepared = TFilters, TVariants = void>({
  filtersKey,
  initialFilters,
  getVariants,
  getData,
  getAppliedFiltersCount,
  queryParser,
  queryTransformer,
  getFiltersValues,
  setFiltersValues,
  valuesOptions,
}: Props<TData, TFilters, TFiltersPrepared, TVariants>): UseFiltersState<TData, TFilters, TVariants> => {
  const [appliedFiltersCount, setAppliedFiltersCount] = useState<number>(0);
  const queryClient = useQueryClient();
  const router = useRouter();
  const queryStringConfig: StringifyOptions = useMemo(
    () => ({arrayFormat: 'bracket', skipNull: true, skipEmptyString: true}),
    [],
  );

  const variants = useQuery<TVariants | null, any>([filtersKey + 'variants'], async () => {
    return getVariants ? getVariants() : null;
  });
  const filters = useQuery<TFilters, any>(
    [filtersKey + 'filters', router.isReady, initialFilters],
    async () => (await getFiltersValues()) ?? initialFilters,
    {
      initialData: () => {
        if (!router.isReady) return undefined;

        const queries = parseUrl(router.asPath, queryStringConfig).query;

        return Object.keys(queries).length ? queryParser(queries) : initialFilters;
      },
      select: (data) => data ?? initialFilters,
    },
  );
  const values = useQuery<TData, any>(
    [filtersKey, filters.data],
    () => getData(filters.data ?? initialFilters),
    valuesOptions,
  );

  const setFilters = useMutation<TFilters, any, TFilters>(setFiltersValues, {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries([filtersKey + 'filters']);
      handleSetFiltersInUrl(data);
    },
  });

  const resetFilters = useMutation<TFilters, any, void | ResetFilterCallback<TFilters>>(
    (callback) => setFiltersValues(callback ? callback(initialFilters) : initialFilters),
    {
      onSuccess: async (data) => {
        await queryClient.invalidateQueries([filtersKey + 'filters']);
        handleSetFiltersInUrl(data);
      },
    },
  );

  useEffect(() => {
    if (getAppliedFiltersCount) {
      setAppliedFiltersCount(getAppliedFiltersCount(filters.data ?? initialFilters));
    }
  }, [filters.data, getAppliedFiltersCount]);

  const handleSetFiltersInUrl = (data: TFilters | undefined) => {
    if (!router.isReady || !data) return;

    const transformedData = queryTransformer ? queryTransformer(data) : data;
    const query = stringify(transformedData, queryStringConfig);
    const {url} = parseUrl(router.asPath);
    const replacedUrl = url + (query ? `?${query}` : '');

    router.replace(replacedUrl, replacedUrl, {scroll: false});
  };

  return {
    appliedFiltersCount,
    values,
    initialFilters: initialFilters,
    filters,
    variants,
    setFilters,
    resetFilters,
  };
};
