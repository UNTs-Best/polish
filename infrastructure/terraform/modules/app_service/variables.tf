variable "name_prefix" {
  description = "Naming prefix for resources"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "sku_name" {
  description = "App Service Plan SKU (F1, B1, S1)"
  type        = string
  default     = "F1"
}

variable "backend_url" {
  description = "Backend Container App FQDN"
  type        = string
}

variable "app_insights_key" {
  description = "Application Insights instrumentation key"
  type        = string
}

variable "app_insights_conn" {
  description = "Application Insights connection string"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
