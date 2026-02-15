environment = "dev"
location    = "eastus"

# App Service — free tier
app_service_sku = "F1"

# Container App — minimal
container_cpu          = 0.25
container_memory       = "0.5Gi"
container_min_replicas = 0
container_max_replicas = 1

# CosmosDB — free tier, fixed 400 RU
cosmosdb_enable_free_tier = true
cosmosdb_throughput_mode  = "fixed"
cosmosdb_throughput       = 400

# Storage — local redundancy
storage_replication_type = "LRS"

# Redis — basic
redis_sku_name = "Basic"
redis_family   = "C"
redis_capacity = 0

# Monitoring — 30 day retention
log_retention_days = 30
