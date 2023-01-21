"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFilters = void 0;
const react_query_1 = require("@tanstack/react-query");
const router_1 = require("next/router");
const base_1 = require("query-string/base");
const react_1 = require("react");
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
const useFilters = ({ filtersKey, initialFilters, getVariants, getData, getAppliedFiltersCount, queryParser, queryTransformer, getFiltersValues, setFiltersValues, valuesOptions, }) => {
    const [appliedFiltersCount, setAppliedFiltersCount] = (0, react_1.useState)(0);
    const queryClient = (0, react_query_1.useQueryClient)();
    const router = (0, router_1.useRouter)();
    const queryStringConfig = (0, react_1.useMemo)(() => ({ arrayFormat: 'bracket', skipNull: true, skipEmptyString: true }), []);
    const variants = (0, react_query_1.useQuery)([filtersKey + 'variants'], () => __awaiter(void 0, void 0, void 0, function* () {
        return getVariants ? getVariants() : null;
    }));
    const filters = (0, react_query_1.useQuery)([filtersKey + 'filters', router.isReady, initialFilters], () => __awaiter(void 0, void 0, void 0, function* () { var _a; return (_a = (yield getFiltersValues())) !== null && _a !== void 0 ? _a : initialFilters; }), {
        initialData: () => {
            if (!router.isReady)
                return undefined;
            const queries = (0, base_1.parseUrl)(router.asPath, queryStringConfig).query;
            return Object.keys(queries).length ? queryParser(queries) : initialFilters;
        },
        select: (data) => data !== null && data !== void 0 ? data : initialFilters,
    });
    const values = (0, react_query_1.useQuery)([filtersKey, filters.data], () => { var _a; return getData((_a = filters.data) !== null && _a !== void 0 ? _a : initialFilters); }, valuesOptions);
    const setFilters = (0, react_query_1.useMutation)(setFiltersValues, {
        onSuccess: (data) => __awaiter(void 0, void 0, void 0, function* () {
            yield queryClient.invalidateQueries([filtersKey + 'filters']);
            handleSetFiltersInUrl(data);
        }),
    });
    const resetFilters = (0, react_query_1.useMutation)((callback) => setFiltersValues(callback ? callback(initialFilters) : initialFilters), {
        onSuccess: (data) => __awaiter(void 0, void 0, void 0, function* () {
            yield queryClient.invalidateQueries([filtersKey + 'filters']);
            handleSetFiltersInUrl(data);
        }),
    });
    (0, react_1.useEffect)(() => {
        var _a;
        if (getAppliedFiltersCount) {
            setAppliedFiltersCount(getAppliedFiltersCount((_a = filters.data) !== null && _a !== void 0 ? _a : initialFilters));
        }
    }, [filters.data, getAppliedFiltersCount]);
    const handleSetFiltersInUrl = (data) => {
        if (!router.isReady || !data)
            return;
        const transformedData = queryTransformer ? queryTransformer(data) : data;
        const query = (0, base_1.stringify)(transformedData, queryStringConfig);
        const { url } = (0, base_1.parseUrl)(router.asPath);
        const replacedUrl = url + (query ? `?${query}` : '');
        router.replace(replacedUrl, replacedUrl, { scroll: false });
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
exports.useFilters = useFilters;
//# sourceMappingURL=filters_manager.service.js.map