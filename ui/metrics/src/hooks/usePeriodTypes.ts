import { PeriodType } from "@/utils/dates";
import { DropdownOption } from "@spcs-apps/page-parts";
import { useState } from "react";

const periodTypeOptions: DropdownOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

/** returns state and options for selecting a period based on day, week, month */
export default function usePeriodTypes() {
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.week);

  return {
    periodType,
    setPeriodType,
    periodTypeOptions,
  };
}
