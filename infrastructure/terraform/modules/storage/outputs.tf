output "account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.this.name
}

output "primary_connection_string" {
  description = "Storage account primary connection string"
  value       = azurerm_storage_account.this.primary_connection_string
  sensitive   = true
}

output "primary_blob_endpoint" {
  description = "Primary blob endpoint URL"
  value       = azurerm_storage_account.this.primary_blob_endpoint
}

output "id" {
  description = "Storage account ID"
  value       = azurerm_storage_account.this.id
}
