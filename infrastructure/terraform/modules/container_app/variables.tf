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

variable "container_cpu" {
  description = "CPU cores for the container"
  type        = number
  default     = 0.25
}

variable "container_memory" {
  description = "Memory for the container"
  type        = string
  default     = "0.5Gi"
}

variable "container_min_replicas" {
  description = "Minimum replicas"
  type        = number
  default     = 0
}

variable "container_max_replicas" {
  description = "Maximum replicas"
  type        = number
  default     = 1
}

variable "acr_login_server" {
  description = "ACR login server URL"
  type        = string
}

variable "acr_admin_user" {
  description = "ACR admin username"
  type        = string
}

variable "acr_admin_pass" {
  description = "ACR admin password"
  type        = string
  sensitive   = true
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  type        = string
}

# Application environment variables
variable "cosmos_endpoint" {
  description = "CosmosDB endpoint"
  type        = string
}

variable "cosmos_key" {
  description = "CosmosDB key"
  type        = string
  sensitive   = true
}

variable "cosmos_database" {
  description = "CosmosDB database name"
  type        = string
}

variable "storage_connection" {
  description = "Storage connection string"
  type        = string
  sensitive   = true
}

variable "redis_connection" {
  description = "Redis connection string"
  type        = string
  sensitive   = true
}

variable "app_insights_key" {
  description = "Application Insights instrumentation key"
  type        = string
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
