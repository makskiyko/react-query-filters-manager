/// <reference types="node" />
import React, { type PropsWithChildren } from 'react';
import { QueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';
import { NextRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
declare type Props<TData, TFilters, TFiltersPrepared = TFilters, TVariants = void> = {
    filtersKey: QueryKey;
    initialFilters: TFilters;
    getData: (params: TFilters) => Promise<TData>;
    queryParser: (query: ParsedUrlQuery) => TFilters;
    getFiltersValues: () => Promise<TFilters | undefined>;
    setFiltersValues: (data: TFilters) => Promise<TFilters>;
    queryTransformer?: (data: TFilters) => TFiltersPrepared;
    getAppliedFiltersCount?: (params: TFilters) => number;
    getVariants?: () => Promise<TVariants>;
    valuesOptions?: Omit<UseQueryOptions<TData, any, TData>, 'queryKey' | 'queryFn' | 'initialData'> & {
        initialData?: () => undefined;
    };
};
declare type ResetFilterCallback<TFilters> = (initialFilters: TFilters) => TFilters;
export declare type UseFiltersState<TData, TFilters, TVariants = void> = {
    appliedFiltersCount: number;
    initialFilters: TFilters;
    filters: UseQueryResult<TFilters, any>;
    values: UseQueryResult<TData, any>;
    variants: UseQueryResult<TVariants | null, any>;
    setFilters: UseMutationResult<TFilters, any, TFilters>;
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
export declare const useFilters: <TData extends unknown, TFilters extends {}, TFiltersPrepared = TFilters, TVariants = void>({ filtersKey, initialFilters, getVariants, getData, getAppliedFiltersCount, queryParser, queryTransformer, getFiltersValues, setFiltersValues, valuesOptions, }: Props<TData, TFilters, TFiltersPrepared, TVariants>) => UseFiltersState<TData, TFilters, TVariants>;
declare type FiltersManagerContextProviderProps = PropsWithChildren<{
    queryClient?: QueryClient;
    router: NextRouter;
}>;
export declare const FiltersManagerContextProvider: ({ queryClient, children, router }: FiltersManagerContextProviderProps) => React.JSX.Element;
export {};
