import { LocalStorageKeys } from "@/constants";
import { COST_PER_CREDIT } from "@/utils/formatters";
import { useState } from "react";

const MIN_COST = COST_PER_CREDIT.min;
const MAX_COST = COST_PER_CREDIT.max;

export default function CreditCost() {
  const [appliedCost, setAppliedCost] = useState<number>(COST_PER_CREDIT.cost);
  const [newCost, setNewCost] = useState<string>(COST_PER_CREDIT.cost + "");
  return (
    <div>
      <div>Cost per Credit: ${appliedCost}</div>
      <div className="mt-1 flex flex-wrap gap-x-2">
        <input
          type="number"
          className="input-main border-main w-20 rounded border px-2 py-1"
          min={MIN_COST}
          max={MAX_COST}
          step="0.01"
          value={newCost}
          onChange={(e) => {
            setNewCost(e.target.value);
          }}
        />
        <button
          type="button"
          className="btn-main rounded-full px-2 py-1 text-sm"
          onClick={() => {
            let next = Number.parseFloat(newCost);
            if (next && !Number.isNaN(next)) {
              if (next < MIN_COST) {
                next = MIN_COST;
              } else if (next > MAX_COST) {
                next = MAX_COST;
              }
              COST_PER_CREDIT.cost = next;
              setNewCost(next + "");
              setAppliedCost(COST_PER_CREDIT.cost);
              try {
                localStorage.setItem(LocalStorageKeys.cost, next + "");
              } catch (e) {
                console.error("unable to save credit cost to local storage");
              }
            }
          }}
        >
          Apply
        </button>
      </div>
      <div className="mt-1 text-xs">You may need to switch pages for costs to change</div>
    </div>
  );
}
