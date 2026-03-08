output "endpoint" {
  description = "CosmosDB account endpoint"
  value       = azurerm_cosmosdb_account.this.endpoint
}

output "primary_key" {
  description = "CosmosDB primary key"
  value       = azurerm_cosmosdb_account.this.primary_key
  sensitive   = true
}

output "database_name" {
  description = "SQL database name"
  value       = azurerm_cosmosdb_sql_database.this.name
}

output "id" {
  description = "CosmosDB account ID"
  value       = azurerm_cosmosdb_account.this.id
}
