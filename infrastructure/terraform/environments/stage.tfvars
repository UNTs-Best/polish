environment = "stage"
location    = "eastus"

# App Service — standard tier (mirrors prod)
app_service_sku = "S1"

# Container App — moderate
container_cpu          = 0.5
container_memory       = "1Gi"
container_min_replicas = 1
container_max_replicas = 3

# CosmosDB — autoscale 4000 max RU
cosmosdb_enable_free_tier = false
cosmosdb_throughput_mode  = "autoscale"
cosmosdb_throughput       = 4000

# Storage — geo-redundant
storage_replication_type = "GRS"

# Redis — standard C1
redis_sku_name = "Standard"
redis_family   = "C"
redis_capacity = 1

# Monitoring — 60 day retention
log_retention_days = 60
