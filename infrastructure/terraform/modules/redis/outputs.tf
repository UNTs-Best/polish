output "hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.this.hostname
}

output "ssl_port" {
  description = "Redis SSL port"
  value       = azurerm_redis_cache.this.ssl_port
}

output "primary_access_key" {
  description = "Redis primary access key"
  value       = azurerm_redis_cache.this.primary_access_key
  sensitive   = true
}

output "connection_string" {
  description = "Redis connection string (rediss://)"
  value       = "rediss://:${azurerm_redis_cache.this.primary_access_key}@${azurerm_redis_cache.this.hostname}:${azurerm_redis_cache.this.ssl_port}"
  sensitive   = true
}

output "id" {
  description = "Redis cache ID"
  value       = azurerm_redis_cache.this.id
}
