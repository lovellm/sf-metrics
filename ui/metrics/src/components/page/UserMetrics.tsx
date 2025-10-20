import { useCallback } from "react";
import FilterPanel from "../filters/FilterPanel";
import { userFilterPanel } from "../filters/filterConfig";
import useAppState from "@/context/useAppState";
import { LocalStorageKeys } from "@/constants";
import { SelectedValues } from "@/types/filterTypes";
import Box from "../basic/Box";
import TopQueries from "../usermetrics/TopQueries";
import UserSummary from "../usermetrics/UserSummary";
import WarehouseTrend from "../usermetrics/WarehouseTrend";
import TopApps from "../usermetrics/TopApps";
import { COST_PER_CREDIT } from "@/utils/formatters";

export default function UserMetrics() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  return (
    <div className="grid grid-cols-12 gap-3 p-2">
      {/* Filters */}
      <Box
        className={
          isFiltersOpen
            ? "col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-3"
            : "col-span-12 sm:col-span-1 sm:w-12"
        }
      >
        <FilterPanel
          config={userFilterPanel}
          localStorageKey={LocalStorageKeys.filters}
          onApply={applyFilters}
        />
      </Box>
      {/* Main Area */}
      <div
        className={
          "flex flex-col gap-y-2 " +
          (isFiltersOpen
            ? "col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-9"
            : "col-span-12 sm:col-span-11 lg:-ml-8 xl:-ml-16")
        }
      >
        <UserSummary filters={filters} userId={undefined} />
        <WarehouseTrend filters={filters} userId={undefined} />
        <TopApps filters={filters} userId={undefined} />
        <TopQueries filters={filters} userId={undefined} />
        <Box className="p-3 text-sm">
          All costs on this page are using a cost price of ${COST_PER_CREDIT.cost}/credit.
        </Box>
      </div>
    </div>
  );
}
