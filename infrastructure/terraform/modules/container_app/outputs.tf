output "fqdn" {
  description = "Container App FQDN"
  value       = azurerm_container_app.backend.ingress[0].fqdn
}

output "id" {
  description = "Container App ID"
  value       = azurerm_container_app.backend.id
}

output "environment_id" {
  description = "Container App Environment ID"
  value       = azurerm_container_app_environment.this.id
}
