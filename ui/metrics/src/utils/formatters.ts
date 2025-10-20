import { LocalStorageKeys } from "@/constants";
import { format } from "d3-format";

export const format2Dec = format("0,.2f");
export const formatter1Dec = format("0,.1f");
export const format0Dec = format("0,.0f");

/** the default cost per credit to use */
export const COST_PER_CREDIT = {
  cost: 3,
  min: 1,
  max: 4,
};
try {
  let defaultCost = Number.parseFloat(localStorage[LocalStorageKeys.cost] as string);
  if (defaultCost && !Number.isNaN(defaultCost)) {
    if (defaultCost < COST_PER_CREDIT.min) {
      defaultCost = COST_PER_CREDIT.min;
    } else if (defaultCost > COST_PER_CREDIT.max) {
      defaultCost = COST_PER_CREDIT.max;
    }
    COST_PER_CREDIT.cost = defaultCost;
  }
} catch (e) {
  console.error("error retrieving cost per credit from local storage", e);
}

/** converts credits to dollars */
export const creditsToDollars = (x: unknown, credits: number = COST_PER_CREDIT.cost): number => {
  if (!x || typeof x !== "number") {
    return 0;
  }
  return x * credits;
};
/** returns cost of credits as a string to 2 decimals */
export const formatCreditCost = (x: unknown, credits: number = COST_PER_CREDIT.cost): string => {
  return "$" + format2Dec(creditsToDollars(x, credits));
};
/** returns cost of credits as a string to 2 decimals in thousands */
export const formatCreditCostK = (x: unknown, credits: number = COST_PER_CREDIT.cost): string => {
  return "$" + format2Dec(creditsToDollars(x, credits) / 1000) + "K";
};
export const formatCreditCostDefault = (x: unknown): string => {
  return formatCreditCost(x);
};
export const formatCreditCostAbs = (x: unknown): string => {
  return "$" + format2Dec(Math.abs(creditsToDollars(x, COST_PER_CREDIT.cost)));
};

export const bytesToGb = (x: unknown): number => {
  if (!x || typeof x !== "number") {
    return 0;
  }
  return x / 1073741824;
};
export const bytesToTb = (x: unknown): number => {
  if (!x || typeof x !== "number") {
    return 0;
  }
  return x / 1099511627776;
};
export const bytesToGbString = (x: unknown): string => {
  const num = asNumber(x);
  if (!num) {
    return "0";
  }
  return format2Dec(num / 1073741824);
};
/** given a number of bytes, returns the dollar cost for it */
export const storageToDollars = (x: unknown, cost: number = 23): number => {
  return bytesToTb(x) * cost;
};
/** given a number of bytes, returns the a formatted string of the cost */
export const formatStorageCost = (x: unknown): string => {
  return "$" + format2Dec(storageToDollars(x));
};

export const countDecimals = (num: number) => {
  // Convert the number to a string
  const numStr = num.toString();

  // Check if there is a decimal point
  if (numStr.includes(".")) {
    // Split the string at the decimal point and get the part after it
    const decimalPart = numStr.split(".")[1];
    // Return the length of the decimal part
    return decimalPart.length;
  }

  // If there is no decimal point, return 0
  return 0;
};
export const formatInteger = (x: unknown): string => {
  if (typeof x === "number") {
    return format0Dec(x);
  }
  if (typeof x === "string") {
    return format0Dec(+x);
  }
  return "";
};
export const format1Dec = (x: unknown): string => {
  if (typeof x === "number") {
    return formatter1Dec(x);
  }
  if (typeof x === "string") {
    return formatter1Dec(+x);
  }
  return "";
};
export const formatBillions = (x: unknown): string => {
  if (!x || typeof x !== "number") {
    return "0";
  }
  const b = x / 1000000000;
  return format1Dec(b);
};
export const formatMillions = (x: unknown): string => {
  if (!x || typeof x !== "number") {
    return "0";
  }
  const m = x / 1000000;
  return format1Dec(m);
};
export const asNumber = (x: unknown): number => {
  if (typeof x === "number") {
    return x || 0;
  }
  if (typeof x === "string") {
    return +x || 0;
  }
  return 0;
};
export const asString = (x: unknown): string => {
  if (typeof x === "number") {
    return "" + x;
  }
  if (typeof x === "string") {
    return x;
  }
  return "";
};
export const formatPercent0 = (x: number): string => {
  return format0Dec(x * 100) + "%";
};
export const formatPercent2 = (x: number): string => {
  return format2Dec(x * 100) + "%";
};
export const formatUnknownPercent2 = (x: unknown): string => {
  if (typeof x === "number") {
    return formatPercent2(x);
  }
  return "";
};
export const div0 = (num1?: number, num2?: number): number => {
  if (!num2 || !num1) {
    return 0;
  }
  return num1 / num2;
};

export const formatMs = (x: unknown): string => {
  let val = asNumber(x) / 1000;
  if (val < 120) {
    return format1Dec(val) + " sec";
  }
  val /= 60;
  if (val < 90) {
    return format1Dec(val) + " min";
  }
  val /= 60;
  return format1Dec(val) + " hour";
};
