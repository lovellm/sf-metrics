create or replace view sf_metrics.v_data_transfer_history (
  logdate,
  start_time,
  end_time,
  source_cloud,
  source_region,
  target_cloud,
  target_region,
  bytes_transferred,
  transfer_type,
  cost_per_tb
)
as
select
  date_trunc('day', start_time) as logdate,
  start_time,
  end_time,
  source_cloud,
  source_region,
  target_cloud,
  target_region,
  bytes_transferred,
  transfer_type,
  -- following is based upon Snowflake existing in a us aws region and will need to be changed if not
  case
    when source_cloud = 'aws' and source_cloud = target_cloud and source_region <> target_region then 20
    when source_cloud = 'aws' and source_cloud <> target_cloud then 90
    else null
  end as cost_per_tb
from snowflake.account_usage.data_transfer_history
;
