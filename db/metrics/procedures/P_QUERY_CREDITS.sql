CREATE OR REPLACE PROCEDURE SF_METRICS.P_QUERY_CREDITS(DAYS_START INTEGER DEFAULT 2, DAYS_END INTEGER DEFAULT 0)
RETURNS VARIANT
LANGUAGE SQL
COMMENT = 'Proportions hourly warehouse cost across all queries that used it'
AS
$$
BEGIN
  MERGE INTO SF_METRICS.QUERY_CREDITS TGT
  USING (
    WITH
      wmh as (
        SELECT
          LOGDATE
          , START_TIME
          , END_TIME
          , WAREHOUSE_ID
          , WAREHOUSE_NAME
          , CREDITS_USED_COMPUTE
        FROM SF_METRICS.WAREHOUSE_METERING_HISTORY
        WHERE
          WAREHOUSE_NAME NOT IN ('CLOUD_SERVICES_ONLY')
          AND LOGDATE >= CURRENT_DATE() - :DAYS_START
          AND LOGDATE < CURRENT_DATE() - :DAYS_END
      ),
      qh as (
        SELECT
          LOGDATE
          , QUERY_ID
          , QUERY_PARAMETERIZED_HASH
          , START_TIME
          , END_TIME
          , EXECUTION_TIME
          , COMPILATION_TIME
          , NVL(EXECUTION_TIME, 0) + NVL(COMPILATION_TIME, 0) as wh_time
          , DATEADD('millisecond', -wh_time, END_TIME) as START_TIME_wh
          , WAREHOUSE_ID
          , WAREHOUSE_NAME
          , QUERY_TAG
          , SESSION_ID
          , USER_NAME
          , ROLE_NAME
          , QUERY_TYPE
          , EXECUTION_STATUS
        FROM SF_METRICS.QUERY_HISTORY
        WHERE
          WAREHOUSE_ID IN (SELECT WAREHOUSE_ID FROM wmh)
          AND LOGDATE >= CURRENT_DATE() - :DAYS_START
          AND LOGDATE < CURRENT_DATE() - :DAYS_END
          -- ignore queries that do not use the warehouse (cached or metadata only)
          AND CLUSTER_NUMBER IS NOT NULL
      ),
      overlap as (
        SELECT
          qh.LOGDATE
          , qh.QUERY_ID
          , qh.QUERY_PARAMETERIZED_HASH
          , qh.SESSION_ID
          , qh.QUERY_TYPE
          , qh.USER_NAME
          , qh.ROLE_NAME
          , wmh.WAREHOUSE_ID
          , wmh.WAREHOUSE_NAME
          , qh.QUERY_TAG
          , qh.EXECUTION_STATUS
          , GREATEST(wmh.START_TIME, ifnull(qh.START_TIME_wh, wmh.START_TIME)) as start_time_segment
          , LEAST(wmh.END_TIME, ifnull(qh.END_TIME, wmh.END_TIME)) as end_time_segment
          , DATEDIFF('millisecond', start_time_segment, end_time_segment) as wh_segment_time
          /* scale compute by this query's duration out of total compute duration for the warehouse metering period */
          , wmh.CREDITS_USED_COMPUTE * (
            wh_segment_time /
            SUM(wh_segment_time) over (partition by wmh.WAREHOUSE_ID, wmh.START_TIME)
          ) as query_credits
        FROM wmh
        LEFT JOIN qh ON (
          wmh.WAREHOUSE_ID = qh.WAREHOUSE_ID
          AND wmh.START_TIME < qh.END_TIME
          AND wmh.END_TIME > qh.START_TIME_wh
        )
      )
    SELECT
      LOGDATE,
      QUERY_ID,
      ANY_VALUE(QUERY_PARAMETERIZED_HASH) as QUERY_PARAMETERIZED_HASH,
      ANY_VALUE(SESSION_ID) as SESSION_ID,
      ANY_VALUE(QUERY_TYPE) as QUERY_TYPE,
      ANY_VALUE(USER_NAME) as USER_NAME,
      ANY_VALUE(ROLE_NAME) as ROLE_NAME,
      ANY_VALUE(WAREHOUSE_NAME) as WAREHOUSE_NAME,
      ANY_VALUE(QUERY_TAG) as QUERY_TAG,
      SUM(query_credits) as QUERY_CREDITS_USED
    FROM overlap
    GROUP BY
      LOGDATE,
      QUERY_ID
  ) AS SRC
  ON
    TGT.QUERY_ID = SRC.QUERY_ID
    AND TGT.LOGDATE = SRC.LOGDATE
  WHEN NOT MATCHED THEN INSERT (
    LOGDATE,
    QUERY_ID,
    QUERY_PARAMETERIZED_HASH,
    QUERY_TYPE,
    SESSION_ID,
    USER_NAME,
    ROLE_NAME,
    WAREHOUSE_NAME,
    QUERY_TAG,
    QUERY_CREDITS_USED
  ) 
  VALUES (
    SRC.LOGDATE,
    SRC.QUERY_ID,
    SRC.QUERY_PARAMETERIZED_HASH,
    SRC.QUERY_TYPE,
    SRC.SESSION_ID,
    SRC.USER_NAME,
    SRC.ROLE_NAME,
    SRC.WAREHOUSE_NAME,
    SRC.QUERY_TAG,
    SRC.QUERY_CREDITS_USED
  )
  ;

  RETURN TRUE;
EXCEPTION
  WHEN OTHER THEN
    RAISE;
END;
$$
;
