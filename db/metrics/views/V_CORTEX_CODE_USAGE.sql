create or replace view sf_metrics.v_cortex_code_usage (
  method,
  user_id,
  user_name,
  display_name,
  logdate,
  usage_time,
  token_credits,
  tokens,

  cli_token_credits,
  cli_tokens,
  snowsight_token_credits,
  snowsight_tokens
)
comment = 'Union of Cortex Code data for both CLI and Snowsight with user name added'
as

with cortexcode as (

  select
    'cli' as method,
    user_id,
    logdate,
    usage_time,
    token_credits,
    tokens
  from sf_metrics.v_cortex_code_cli_usage_history cli

  union all

  select
    'snowsight',
    user_id,
    logdate,
    usage_time,
    token_credits,
    tokens
    from sf_metrics.v_cortex_code_snowsight_usage_history snowsight

)

select
  cortexcode.method,
  cortexcode.user_id,
  users.name as user_name,
  users.display_name as display_name,
  cortexcode.logdate,
  cortexcode.usage_time,
  cortexcode.token_credits,
  cortexcode.tokens,
  -- add pivoted amounts to simplify downstream aggregated use
  iff(cortexcode.method = 'cli', cortexcode.token_credits, null) as cli_token_credits,
  iff(cortexcode.method = 'cli', cortexcode.tokens, null) as cli_tokens,
  iff(cortexcode.method = 'snowsight', cortexcode.token_credits, null) as snowsight_token_credits,
  iff(cortexcode.method = 'snowsight', cortexcode.tokens, null) as snowsight_tokens
from cortexcode
left join sf_metrics.v_users users
  on (users.user_id = cortexcode.user_id)

;
