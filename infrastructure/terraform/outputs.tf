output "resource_group_name" {
  description = "Name of the resource group"
  value       = module.resource_group.name
}

output "frontend_url" {
  description = "URL of the Next.js frontend"
  value       = module.app_service.default_hostname
}

output "backend_url" {
  description = "URL of the Express backend"
  value       = module.container_app.fqdn
}

output "cosmosdb_endpoint" {
  description = "CosmosDB account endpoint"
  value       = module.cosmosdb.endpoint
}

output "cosmosdb_primary_key" {
  description = "CosmosDB primary key"
  value       = module.cosmosdb.primary_key
  sensitive   = true
}

output "storage_account_name" {
  description = "Storage account name"
  value       = module.storage.account_name
}

output "storage_primary_connection_string" {
  description = "Storage account primary connection string"
  value       = module.storage.primary_connection_string
  sensitive   = true
}

output "acr_login_server" {
  description = "Container Registry login server"
  value       = module.container_registry.login_server
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = module.redis.hostname
}

output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = module.monitoring.instrumentation_key
  sensitive   = true
}
