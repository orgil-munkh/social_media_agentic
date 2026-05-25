-- Remove legacy Facebook and Threads measurement rows (Instagram-only pipeline)

DELETE FROM engagement_metrics WHERE platform IN ('facebook', 'threads');
DELETE FROM platform_posts WHERE platform IN ('facebook', 'threads');
DELETE FROM posting_time_stats WHERE platform IN ('facebook', 'threads');
