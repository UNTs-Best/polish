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
  description = "CosmosDB SQL database name"
  value       = azurerm_cosmosdb_sql_database.this.name
}

output "account_name" {
  description = "CosmosDB account name"
  value       = azurerm_cosmosdb_account.this.name
}

output "connection_strings" {
  description = "CosmosDB connection strings"
  value       = azurerm_cosmosdb_account.this.connection_strings
  sensitive   = true
}
