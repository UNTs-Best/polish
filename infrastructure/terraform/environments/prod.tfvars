environment = "prod"
location    = "eastus"

# App Service — standard tier
app_service_sku = "S1"

# Container App — full capacity
container_cpu          = 1.0
container_memory       = "2Gi"
container_min_replicas = 2
container_max_replicas = 10

# CosmosDB — autoscale 10000 max RU
cosmosdb_enable_free_tier = false
cosmosdb_throughput_mode  = "autoscale"
cosmosdb_throughput       = 10000

# Storage — read-access geo-redundant
storage_replication_type = "RAGRS"

# Redis — standard C2
redis_sku_name = "Standard"
redis_family   = "C"
redis_capacity = 2

# Monitoring — 90 day retention
log_retention_days = 90
