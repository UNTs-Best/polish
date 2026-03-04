output "default_hostname" {
  description = "Default hostname of the web app"
  value       = azurerm_linux_web_app.this.default_hostname
}

output "id" {
  description = "Web app resource ID"
  value       = azurerm_linux_web_app.this.id
}

output "service_plan_id" {
  description = "App Service Plan ID"
  value       = azurerm_service_plan.this.id
}
