import { DataResult, Query } from "../dataApi";
import HttpRequest from "../utils/HttpRequest";
import { getApiUrlForEndpoint } from "../utils/apiConstants";

interface GetSnowflakeSqlOptions {
  sql?: string;
  query?: Query;
}

export default async function getSnowflakeSql({
  sql,
  query,
}: GetSnowflakeSqlOptions): Promise<string> {
  if (sql) {
    return sql;
  }
  if (query) {
    const request = new HttpRequest({ cancelOnFetch: true, timeout: 5000 });
    const result = await request.post<DataResult>(getApiUrlForEndpoint("generateQuery"), query);
    if (result?.sql) {
      return result.sql;
    }
  }
  return "";
}
