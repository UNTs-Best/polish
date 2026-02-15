output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.this.id
}

output "instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.this.instrumentation_key
  sensitive   = true
}

output "connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.this.connection_string
  sensitive   = true
}

output "app_id" {
  description = "Application Insights app ID"
  value       = azurerm_application_insights.this.app_id
}
