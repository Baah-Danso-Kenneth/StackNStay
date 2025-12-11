-- Clear all dummy/test property data from PostgreSQL
-- Run this SQL script to remove test data

-- Show current count
SELECT COUNT(*) as total_properties FROM property_embeddings;

-- Show sample data
SELECT property_id, title, metadata->'location_city' as city 
FROM property_embeddings 
LIMIT 10;

-- DELETE ALL PROPERTIES (uncomment to execute)
-- DELETE FROM property_embeddings;

-- Verify deletion
-- SELECT COUNT(*) as remaining_properties FROM property_embeddings;
