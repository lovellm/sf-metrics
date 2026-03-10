import { useCallback, useMemo } from "react";
import { ErrorMessage, LoadingFitParent, parseQueryResponse } from "@spcs-apps/data-utils";
import { Box } from "@spcs-apps/page-parts";
import useAppState from "@/context/useAppState";
import { LocalStorageKeys } from "@/constants";
import { SelectedValues } from "@/types/filterTypes";
import {
  CortexSearchService,
  CortexRestApi,
  CortexAISql,
  specForCortexSearch,
  specForCortexRestApi,
  specForCortexAISql,
  CortexAgent,
  specForCortexAgent,
} from "@/specs/cortexSpecs";
import { defaultCache } from "@/data/dataCache";
import { formatCreditCostDefault, formatInteger } from "@/utils/formatters";
import { getDateStringForUnknown } from "@/utils/dates";
import { useQuery } from "@/hooks/useApiData";
import FilterPanel from "../filters/FilterPanel";
import { aiFilterPanel } from "../filters/filterConfig";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";

const restApiColumns: SortableTableColumn<CortexRestApi>[] = [
  {
    accessor: "model_name",
    Header: "Model",
    width: 200,
    sortable: true,
  },
  {
    accessor: "name",
    Header: "User Id",
    width: 120,
    sortable: true,
  },
  {
    accessor: "display_name",
    Header: "User",
    width: 200,
    sortable: true,
  },
  {
    accessor: "tokens",
    Header: "Total Tokens",
    width: 140,
    format: formatInteger,
    sortable: true,
  },
  {
    accessor: "first_date",
    Header: "First Used",
    width: 120,
    format: getDateStringForUnknown,
  },
  {
    accessor: "last_date",
    Header: "Last Used",
    width: 120,
    format: getDateStringForUnknown,
  },
];

const aiSqlColumns: SortableTableColumn<CortexRestApi>[] = [
  {
    accessor: "function_name",
    Header: "Function",
    width: 120,
    sortable: true,
  },
  {
    accessor: "model_name",
    Header: "Model",
    width: 200,
    sortable: true,
  },
  {
    accessor: "name",
    Header: "User Id",
    width: 100,
    sortable: true,
  },
  {
    accessor: "display_name",
    Header: "User",
    width: 200,
    sortable: true,
  },
  {
    accessor: "tokens",
    Header: "Total Tokens",
    width: 140,
    format: formatInteger,
    sortable: true,
  },
  {
    accessor: "token_credits",
    Header: "Total Cost",
    width: 140,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "first_date",
    Header: "First Used",
    width: 120,
    format: getDateStringForUnknown,
  },
  {
    accessor: "last_date",
    Header: "Last Used",
    width: 120,
    format: getDateStringForUnknown,
  },
];

const agentColumns: SortableTableColumn<CortexRestApi>[] = [
  {
    accessor: "agent_database_name",
    Header: "Database",
    width: 120,
    sortable: true,
  },
  {
    accessor: "agent_schema_name",
    Header: "Schema",
    width: 120,
    sortable: true,
  },
  {
    accessor: "agent_name",
    Header: "Agent",
    width: 200,
    sortable: true,
  },
  {
    accessor: "user_name",
    Header: "User Id",
    width: 100,
    sortable: true,
  },
  {
    accessor: "display_name",
    Header: "User",
    width: 200,
    sortable: true,
  },
  {
    accessor: "tokens",
    Header: "Total Tokens",
    width: 140,
    format: formatInteger,
    sortable: true,
  },
  {
    accessor: "token_credits",
    Header: "Total Cost",
    width: 140,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "first_date",
    Header: "First Used",
    width: 120,
    format: getDateStringForUnknown,
  },
  {
    accessor: "last_date",
    Header: "Last Used",
    width: 120,
    format: getDateStringForUnknown,
  },
];

const searchColumns: SortableTableColumn<CortexSearchService>[] = [
  {
    accessor: "database_name",
    Header: "DB",
    width: 100,
    sortable: true,
  },
  {
    accessor: "schema_name",
    Header: "Schema",
    width: 110,
    sortable: true,
  },
  {
    accessor: "service_name",
    Header: "Service Name",
    width: 160,
    sortable: true,
  },
  {
    accessor: "consumption_type",
    Header: "Consumption Type",
    width: 160,
    sortable: true,
  },
  {
    accessor: "model_name",
    Header: "Model",
    width: 220,
    sortable: true,
  },
  {
    accessor: "credits",
    Header: "Credit Cost",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "tokens",
    Header: "Total Tokens",
    width: 120,
    format: formatInteger,
    sortable: true,
  },
];

export default function Cortex() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  // Cortex Rest API
  const summaryQuery = useMemo(() => {
    return specForCortexRestApi(filters);
  }, [filters]);
  const {
    data: summaryData,
    isLoading: summaryIsLoading,
    error: summaryError,
  } = useQuery(summaryQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<CortexRestApi>(summaryData, summaryQuery.columns);
    return objs;
  }, [summaryData, summaryQuery]);

  // Cortex Search
  const searchQuery = useMemo(() => {
    return specForCortexSearch(filters);
  }, [filters]);
  const {
    data: searchData,
    isLoading: searchIsLoading,
    error: searchError,
  } = useQuery(searchQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const searchObjs = useMemo(() => {
    const objs = parseQueryResponse<CortexSearchService>(searchData, searchQuery.columns);
    return objs;
  }, [searchData, searchQuery]);

  // Cortex AISQL
  const aiSqlQuery = useMemo(() => {
    return specForCortexAISql(filters);
  }, [filters]);
  const {
    data: aiSqlData,
    isLoading: aiSqlIsLoading,
    error: aiSqlError,
  } = useQuery(aiSqlQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const aiSqlObjs = useMemo(() => {
    const objs = parseQueryResponse<CortexAISql>(aiSqlData, aiSqlQuery.columns);
    return objs;
  }, [aiSqlData, aiSqlQuery]);

  // Cortex Agent
  const agentQuery = useMemo(() => {
    return specForCortexAgent(filters);
  }, [filters]);
  const {
    data: agentData,
    isLoading: agentIsLoading,
    error: agentError,
  } = useQuery(agentQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const agentObjs = useMemo(() => {
    const objs = parseQueryResponse<CortexAgent>(agentData, agentQuery.columns);
    return objs;
  }, [agentData, agentQuery]);

  return (
    <div className="grid grid-cols-12 gap-3 p-2">
      {/* Filters */}
      <div
        className={
          isFiltersOpen
            ? "col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-3"
            : "col-span-12 sm:col-span-1 sm:w-12"
        }
      >
        <Box className="sticky top-0">
          <FilterPanel
            config={aiFilterPanel}
            localStorageKey={LocalStorageKeys.filters}
            onApply={applyFilters}
          />
          {isFiltersOpen && (
            <div className="mb-2 px-2 text-sm">
              If no query date is selected, it will default to the start of previous month
            </div>
          )}
        </Box>
      </div>
      {/* Main Area */}
      <div
        className={
          "flex flex-col gap-y-2 " +
          (isFiltersOpen
            ? "col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-9"
            : "col-span-12 sm:col-span-11 lg:-ml-8 xl:-ml-16")
        }
      >
        {/* AISQL */}
        <Box className="p-2">
          <div>
            <div className="text-lg">Cortex AISQL Summary by Model</div>
          </div>
          <div className="relative mt-1 min-h-20 max-h-96 overflow-auto">
            {aiSqlIsLoading && <LoadingFitParent>Loading AISQL</LoadingFitParent>}
            <TableLocalSort<CortexAISql>
              data={aiSqlObjs}
              columns={aiSqlColumns}
              pageSize={30}
              multiSort
              fullWidth
            />
          </div>
          {aiSqlError && <ErrorMessage error={aiSqlError} message="Error Retrieving AI SQL" />}
        </Box>
        {/* Agents */}
        <Box className="p-2">
          <div>
            <div className="text-lg">Cortex Agents Summary</div>
          </div>
          <div className="relative mt-1 min-h-20 max-h-96 overflow-auto">
            {agentIsLoading && <LoadingFitParent>Loading Agent Data</LoadingFitParent>}
            <TableLocalSort<CortexAgent>
              data={agentObjs}
              columns={agentColumns}
              pageSize={30}
              multiSort
              fullWidth
            />
          </div>
          {agentError && <ErrorMessage error={agentError} message="Error Retrieving Agent Data" />}
        </Box>
        {/* REST API */}
        <Box className="p-2">
          <div>
            <div className="text-lg">Cortex REST API Summary by Model</div>
            <div className="text-sm">
              Token cost depends on the model used. Refer to{" "}
              <a
                href="https://www.snowflake.com/legal-files/CreditConsumptionTable.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="a-main"
              >
                Snowflake Credit Consumption Table 6(c)
              </a>{" "}
              for the current costs.
            </div>
          </div>
          <div className="relative mt-1 min-h-20 max-h-96 overflow-auto">
            {summaryIsLoading && <LoadingFitParent>Loading REST API</LoadingFitParent>}
            <TableLocalSort<CortexRestApi>
              data={objs}
              columns={restApiColumns}
              pageSize={30}
              multiSort
              fullWidth
            />
          </div>
          {summaryError && (
            <ErrorMessage error={summaryError} message="Error Retrieving REST API" />
          )}
        </Box>
        {/* Cortex Search */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">Cortex Search Summary</div>
          <div className="relative mt-1 min-h-20 max-h-96 overflow-auto">
            {searchIsLoading && <LoadingFitParent>Loading Search Summary</LoadingFitParent>}
            <TableLocalSort<CortexSearchService>
              data={searchObjs}
              columns={searchColumns}
              pageSize={30}
              multiSort
              fullWidth
            />
          </div>
          {searchError && (
            <ErrorMessage error={searchError} message="Error Retrieving Search Summary" />
          )}
        </Box>
      </div>
    </div>
  );
}
