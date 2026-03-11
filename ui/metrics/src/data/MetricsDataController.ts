import { DataApplication, DataQueryType, DataWarehouseName } from "@/types/commonTypes";
import { DataCache, CommonDataController } from "@spcs-apps/data-utils";
import { getMonthForMonthsAgo } from "@/utils/dates";
import { defaultCache } from "./dataCache";

class MetricsDataController extends CommonDataController {
  constructor(cache: DataCache) {
    super(cache);
  }

  private async queryQueryType(): Promise<DataQueryType[]> {
    const key = "common_data_query_type";
    return this.genericQuery<DataQueryType>(key, {
      schema: "SF_METRICS",
      table: "V_USER_QUERY_FACT",
      columns: ["QUERY_TYPE"],
      filter: {
        gte: ["LOGDATE", `'${getMonthForMonthsAgo(1)}'`],
      },
      distinct: true,
      limit: 1000,
      asUser: true,
    });
  }
  async getQueryType(): Promise<DataQueryType[]> {
    const key = "query_type";
    const action = async (): Promise<DataQueryType[]> => {
      const rawData = await this.queryQueryType();
      return rawData;
    };
    return this.genericGet<DataQueryType>(key, action);
  }

  private async queryWarehouseName(): Promise<DataWarehouseName[]> {
    const key = "common_data_warehouse_name";
    return this.genericQuery<DataWarehouseName>(key, {
      schema: "SF_METRICS",
      table: "V_WAREHOUSE_METERING_HISTORY",
      columns: ["WAREHOUSE_NAME"],
      filter: {
        gte: ["LOGDATE", `'${getMonthForMonthsAgo(1)}'`],
      },
      distinct: true,
      limit: 1000,
      asUser: true,
    });
  }
  async getWarehouseName(): Promise<DataWarehouseName[]> {
    const key = "warehouse_name";
    const action = async (): Promise<DataWarehouseName[]> => {
      const rawData = await this.queryWarehouseName();
      return rawData;
    };
    return this.genericGet<DataWarehouseName>(key, action);
  }

  private async queryApplication(): Promise<DataApplication[]> {
    const key = "common_data_application";
    return this.genericQuery<DataApplication>(key, {
      schema: "SF_METRICS",
      table: "V_USER_QUERY_FACT",
      columns: ["APPLICATION"],
      filter: {
        gte: ["LOGDATE", `'${getMonthForMonthsAgo(1)}'`],
      },
      distinct: true,
      limit: 1000,
      asUser: true,
    });
  }
  async getApplication(): Promise<DataApplication[]> {
    const key = "application";
    const action = async (): Promise<DataApplication[]> => {
      const rawData = await this.queryApplication();
      return rawData;
    };
    return this.genericGet<DataApplication>(key, action);
  }
}

const metricsDataController = new MetricsDataController(defaultCache);
export default metricsDataController;
