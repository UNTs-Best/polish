output "login_server" {
  description = "ACR login server URL"
  value       = azurerm_container_registry.this.login_server
}

output "admin_username" {
  description = "ACR admin username"
  value       = azurerm_container_registry.this.admin_username
}

output "admin_password" {
  description = "ACR admin password"
  value       = azurerm_container_registry.this.admin_password
  sensitive   = true
}

output "id" {
  description = "ACR resource ID"
  value       = azurerm_container_registry.this.id
}
