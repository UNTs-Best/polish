# ──────────────────────────────────────────────
# Resource Group
# ──────────────────────────────────────────────
module "resource_group" {
  source = "./modules/resource_group"

  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.common_tags
}

# ──────────────────────────────────────────────
# Monitoring (created early — other modules reference it)
# ──────────────────────────────────────────────
module "monitoring" {
  source = "./modules/monitoring"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  retention_days      = var.log_retention_days
  tags                = local.common_tags
}

# ──────────────────────────────────────────────
# CosmosDB
# ──────────────────────────────────────────────
module "cosmosdb" {
  source = "./modules/cosmosdb"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  enable_free_tier    = var.cosmosdb_enable_free_tier
  throughput_mode     = var.cosmosdb_throughput_mode
  throughput          = var.cosmosdb_throughput
  containers          = local.cosmosdb_containers
  tags                = local.common_tags
}

# ──────────────────────────────────────────────
# Storage
# ──────────────────────────────────────────────
module "storage" {
  source = "./modules/storage"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  replication_type    = var.storage_replication_type
  tags                = local.common_tags
}

# ──────────────────────────────────────────────
# Container Registry
# ──────────────────────────────────────────────
module "container_registry" {
  source = "./modules/container_registry"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tags                = local.common_tags
}

# ──────────────────────────────────────────────
# Container App (Express backend)
# ──────────────────────────────────────────────
module "container_app" {
  source = "./modules/container_app"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location

  container_cpu          = var.container_cpu
  container_memory       = var.container_memory
  container_min_replicas = var.container_min_replicas
  container_max_replicas = var.container_max_replicas

  acr_login_server = module.container_registry.login_server
  acr_admin_user   = module.container_registry.admin_username
  acr_admin_pass   = module.container_registry.admin_password

  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id

  # Application environment variables
  cosmos_endpoint      = module.cosmosdb.endpoint
  cosmos_key           = module.cosmosdb.primary_key
  cosmos_database      = module.cosmosdb.database_name
  storage_connection   = module.storage.primary_connection_string
  redis_connection     = module.redis.connection_string
  app_insights_key     = module.monitoring.instrumentation_key
  openai_api_key       = var.openai_api_key
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  jwt_secret           = var.jwt_secret

  tags = local.common_tags
}

# ──────────────────────────────────────────────
# App Service (Next.js frontend)
# ──────────────────────────────────────────────
module "app_service" {
  source = "./modules/app_service"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  sku_name            = var.app_service_sku
  backend_url         = module.container_app.fqdn
  app_insights_key    = module.monitoring.instrumentation_key
  app_insights_conn   = module.monitoring.connection_string
  tags                = local.common_tags
}

# ──────────────────────────────────────────────
# Redis
# ──────────────────────────────────────────────
module "redis" {
  source = "./modules/redis"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  sku_name            = var.redis_sku_name
  family              = var.redis_family
  capacity            = var.redis_capacity
  tags                = local.common_tags
}
