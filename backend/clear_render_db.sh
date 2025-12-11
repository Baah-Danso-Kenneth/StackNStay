#!/bin/bash
# Delete all dummy properties from Render PostgreSQL database

echo "============================================================"
echo "  DELETING DUMMY DATA FROM RENDER POSTGRESQL"
echo "============================================================"

# Extract connection details from DATABASE_URL
DATABASE_URL="postgresql+asyncpg://stacknstaydb_user:2gvtrsksUIV6mFQw6N5ci8qIm7ZVzIAt@dpg-d4romba4d50c73b0hiu0-a.virginia-postgres.render.com/stacknstaydb"

# Convert to standard postgresql:// format for psql
PSQL_URL=$(echo $DATABASE_URL | sed 's/postgresql+asyncpg/postgresql/')

echo ""
echo "📊 Checking current property count..."

# Count properties
PGPASSWORD="2gvtrsksUIV6mFQw6N5ci8qIm7ZVzIAt" psql -h dpg-d4romba4d50c73b0hiu0-a.virginia-postgres.render.com -U stacknstaydb_user -d stacknstaydb -c "SELECT COUNT(*) as total_properties FROM property_embeddings;"

echo ""
echo "📋 Sample dummy data:"
PGPASSWORD="2gvtrsksUIV6mFQw6N5ci8qIm7ZVzIAt" psql -h dpg-d4romba4d50c73b0hiu0-a.virginia-postgres.render.com -U stacknstaydb_user -d stacknstaydb -c "SELECT property_id, title FROM property_embeddings LIMIT 5;"

echo ""
echo "⚠️  THIS WILL DELETE ALL 9 DUMMY PROPERTIES!"
read -p "Type 'YES' to confirm deletion: " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ Deletion cancelled"
    exit 1
fi

echo ""
echo "🗑️  Deleting all properties..."
PGPASSWORD="2gvtrsksUIV6mFQw6N5ci8qIm7ZVzIAt" psql -h dpg-d4romba4d50c73b0hiu0-a.virginia-postgres.render.com -U stacknstaydb_user -d stacknstaydb -c "DELETE FROM property_embeddings;"

echo ""
echo "✅ Verifying deletion..."
PGPASSWORD="2gvtrsksUIV6mFQw6N5ci8qIm7ZVzIAt" psql -h dpg-d4romba4d50c73b0hiu0-a.virginia-postgres.render.com -U stacknstaydb_user -d stacknstaydb -c "SELECT COUNT(*) as remaining_properties FROM property_embeddings;"

echo ""
echo "🎉 Database cleaned!"
echo ""
echo "💡 Next steps:"
echo "   1. Restart backend: kill the uvicorn process and restart"
echo "   2. Chat will now show 'No properties found' (correct!)"
echo "   3. Add real properties to blockchain, then:"
echo "      curl -X POST http://localhost:8000/api/index"
