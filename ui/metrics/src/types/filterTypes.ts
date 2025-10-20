import { Filter, OpereratorsCompare } from "./dataApi";

export type FilterPath = string;
export type ApiField = string;
export type FilterOptionValue = string | number | undefined;
export interface FilterOptionEntry {
  value: string;
  label?: string;
  [key: string]: FilterOptionValue;
  operator?: OpereratorsCompare;
}
/** mapping of some string to array of selected option values related to it */
export type SelectedValues = Record<FilterPath, FilterOptionEntry[]>;

export type FilterConfigType =
  | "dropdown"
  | "text"
  | "number"
  | "toggle"
  | "bulk"
  | "dropdownbulk"
  | "date"
  | "timestamp"
  | "duration";
export interface FilterConfig {
  /** type of filter control */
  type: FilterConfigType;
  /** display label. must be unique within a filter panel */
  label: string;
  /** additional description for the filter */
  info?: string;
  /** internal unique id for how this filter should behave */
  path: string;
  /** true to render as being required */
  required?: boolean;
  /** limit to single value selection, only applies to dropdown */
  single?: boolean;
  /** array of `path` for other filters that this filter depend upon, only applies to dropdown, dropdownbulk */
  dependencies?: string[];
  /** configuration for a server side filter, only applies to dropdown, dropdownbulk */
  serverSide?: ServerSideFilter;
  /** default operator, only applies to number, timestamp */
  defaultOperator?: OpereratorsCompare;
  /** allow operator to be changed, only applies to number, timestamp*/
  changeOperator?: boolean;
  /** for duration, maximum value (in ms) */
  maxValue?: number;
}
/** how a server side filter should behave */
export interface ServerSideFilter {
  /** if true, show the id in parens after the display fields */
  showId?: boolean;
  /** id field for filter, used as the filter value. defaults to `apiTable_id` */
  idField?: string;
  /** list of fields to display in the dropdown */
  displayFields: string[];
  /** the API table to retrieve the values from */
  apiTable: string;
  /** filter string to always add to the search */
  filter?: Filter;
  /** if true, add distinct to the search */
  distinct?: boolean;
  /** list of fields that the search should look against. if not given, uses displayFields + idField */
  searchFields?: string[];
  /** if given additionally filter results by these fields. key is filter's path, value is api field name */
  dependencyMapping?: Record<string, string>;
  /** limit to retrieve per search */
  limit?: number;
  /** minimum number of search characters to initiate a serverside search */
  minSearch?: number;
  /** for ad-hoc table, db to use */
  apiDb?: string;
  /** for ad-hoc table, schema to use */
  apiSchema?: string;
  /** if true, run the query as user instead of as service */
  asUser?: boolean;
}
export interface FilterSectionConfig {
  label?: string;
  showLabel?: boolean;
  startCollapsed?: boolean;
  filters: Array<FilterConfig | undefined>;
}
export type FilterPanelConfig = FilterSectionConfig[];
export type HandleSelectedOption = (
  path: string,
  value: FilterOptionEntry | FilterOptionEntry[],
  replace?: boolean,
) => void;
export type HandleRemoveOption = (path: string, value?: FilterOptionValue) => void;

export interface CommonFilterProps {
  filter: FilterConfig;
  onSelected: HandleSelectedOption;
  onRemoved: HandleRemoveOption;
  selectedValues: SelectedValues;
}
