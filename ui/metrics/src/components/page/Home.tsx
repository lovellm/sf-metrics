import Box from "../basic/Box";

export default function Home() {
  return (
    <Box className="m-3 p-2">
      <h1 className="text-xl">Snowflake Metrics</h1>
      <dl>
        <dt className="mt-2 font-bold">How is cost determined?</dt>
        <dd>
          Some pages will provide additional details. In general, the total duration of all query
          exeuctions for a warehouse for an hour is calculated, and then each query's execution
          duration is compared to that in order to proportion out the total cost of the warehouse
          over that period (time queued is ignored). This means if only one query runs on a
          warehouse, it is allocated the entire cost of the warehouse (including minimum charges and
          idle time until suspension). As more queries are run, the cost is distributed among them.
        </dd>
        <dt className="mt-2 font-bold">What is the latency for the data?</dt>
        <dd>You should expect the available data to be from the previous day.</dd>
        <dt className="mt-2 font-bold">What data am I able to see?</dt>
        <dd className="list pl-2">
          <ul>
            <li>User Queries - Most people can see their own queries.</li>
            <li>System Queries (Tasks, etc.) - Most people can see system queries</li>
          </ul>
        </dd>
        <dt className="mt-2 font-bold">Why am I getting an error?</dt>
        <dd>Most likely it means you do not have access to the data.</dd>
      </dl>
    </Box>
  );
}
