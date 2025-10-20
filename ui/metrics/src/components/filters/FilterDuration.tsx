import { CommonFilterProps } from "@/types/filterTypes";
import { useEffect, useState } from "react";
import { IoCheckmark } from "react-icons/io5";
import Dropdown, { DropdownOption } from "../basic/Dropdown";
import { countDecimals } from "@/utils/formatters";

type DurationScale = "second" | "minute" | "hour" | "day";
const durationScales: DropdownOption[] = [
  { value: "second", label: "Seconds" },
  { value: "minute", label: "Minutes" },
  { value: "hour", label: "Hours" },
  { value: "day", label: "Days" },
];
const multipliers: Record<DurationScale, number> = {
  second: 1000,
  minute: 1000 * 60,
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24,
};

export default function FilterDuration({
  filter,
  onSelected,
  onRemoved,
  selectedValues,
}: CommonFilterProps) {
  const activeValue = selectedValues[filter?.path]?.[0]?.value || "";
  const [value, setValue] = useState<string>(activeValue);
  const [realValue, setRealValue] = useState<string>(activeValue);
  const [scale, setScale] = useState<DurationScale>("hour");

  // when the value (in ms) changes, update the displayed value and scale to a reasonable higher value than ms
  useEffect(() => {
    const asNum = +activeValue;
    const asDays = asNum / multipliers["day"];
    const asHours = asNum / multipliers["hour"];
    const asMins = asNum / multipliers["minute"];
    const asSeconds = asNum / multipliers["second"];
    if (asDays > 2 && countDecimals(asDays) < 2) {
      setValue("" + asDays);
      setScale("day");
    } else if (asHours > 2 && countDecimals(asHours) < 5) {
      setValue("" + asHours);
      setScale("hour");
    } else if (asMins > 2 && countDecimals(asMins) < 5) {
      setValue("" + asMins);
      setScale("minute");
    } else {
      setValue("" + asSeconds);
      setScale("second");
    }
  }, [activeValue]);

  const handleApply = () => {
    if (value && typeof onSelected === "function") {
      const scaledValue = getScaledValue(value, scale, filter.maxValue);
      onSelected(filter.path, { value: "" + scaledValue }, true);
    } else if (!value && typeof onRemoved === "function") {
      onRemoved(filter.path);
    }
  };

  if (!filter) {
    return undefined;
  }

  const needsApply = activeValue !== realValue;

  return (
    <div className="mb-1">
      <div className="text-sm">{filter.label}</div>
      <div className="flex w-full gap-x-2">
        <input
          className="input-main w-12 shrink grow px-2"
          type="number"
          min={0}
          max={filter.maxValue || undefined}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setRealValue("" + getScaledValue(e.target.value, scale, filter.maxValue));
          }}
        />

        <div className="shrink-0">
          <Dropdown
            fullWidth
            options={durationScales}
            value={scale}
            onSelect={setScale}
            compact
            center
          />
        </div>
        <button
          type="button"
          disabled={!value || !needsApply}
          className={"btn-main shrink-0 rounded px-1 " + (needsApply ? "animate-subtle-ping" : "")}
          onClick={handleApply}
        >
          <IoCheckmark />
        </button>
      </div>
    </div>
  );
}

const getScaledValue = (value: string, scale: DurationScale, maxValue?: number): number => {
  let scaledValue = (multipliers[scale] || 1) * (+value || 0);
  if (maxValue && scaledValue > maxValue) {
    scaledValue = maxValue;
  }
  return scaledValue;
};
