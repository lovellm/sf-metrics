import { AppConfigOption } from "@/constants";

interface ListOptionsProps {
  options?: AppConfigOption[];
  currentOption: string;
  setCurrentOption: (next: string) => void;
}

export default function ListOptions({
  options,
  currentOption,
  setCurrentOption,
}: ListOptionsProps) {
  if (!options) {
    return null;
  }
  return (
    <div>
      <ul>
        {options.map((option) => (
          <li key={option.optionName}>
            <button
              type="button"
              className={
                "a-main w-full px-2 text-left " +
                (option?.optionName === currentOption
                  ? "bg-accent-light font-bold dark:bg-neutral-800"
                  : "")
              }
              onClick={() => {
                if (option.optionName === currentOption) {
                  setCurrentOption("");
                } else {
                  setCurrentOption(option.optionName || "");
                }
              }}
            >
              {option.optionName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
