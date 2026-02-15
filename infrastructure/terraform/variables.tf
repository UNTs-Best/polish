# ──────────────────────────────────────────────
# General
# ──────────────────────────────────────────────
variable "project" {
  description = "Project name used in resource naming"
  type        = string
  default     = "polish"
}

variable "environment" {
  description = "Environment name (dev, test, stage, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "test", "stage", "prod"], var.environment)
    error_message = "Environment must be one of: dev, test, stage, prod."
  }
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "eastus"
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

# ──────────────────────────────────────────────
# App Service (Next.js Frontend)
# ──────────────────────────────────────────────
variable "app_service_sku" {
  description = "App Service Plan SKU (F1, B1, S1)"
  type        = string
  default     = "F1"
}

# ──────────────────────────────────────────────
# Container App (Express Backend)
# ──────────────────────────────────────────────
variable "container_cpu" {
  description = "CPU cores for the container app"
  type        = number
  default     = 0.25
}

variable "container_memory" {
  description = "Memory for the container app (e.g. 0.5Gi)"
  type        = string
  default     = "0.5Gi"
}

variable "container_min_replicas" {
  description = "Minimum number of container replicas"
  type        = number
  default     = 0
}

variable "container_max_replicas" {
  description = "Maximum number of container replicas"
  type        = number
  default     = 1
}

# ──────────────────────────────────────────────
# CosmosDB
# ──────────────────────────────────────────────
variable "cosmosdb_enable_free_tier" {
  description = "Enable CosmosDB free tier (only one per subscription)"
  type        = bool
  default     = false
}

variable "cosmosdb_throughput_mode" {
  description = "Throughput mode: 'fixed' or 'autoscale'"
  type        = string
  default     = "fixed"

  validation {
    condition     = contains(["fixed", "autoscale"], var.cosmosdb_throughput_mode)
    error_message = "Throughput mode must be 'fixed' or 'autoscale'."
  }
}

variable "cosmosdb_throughput" {
  description = "CosmosDB throughput (RU/s for fixed, max RU/s for autoscale)"
  type        = number
  default     = 400
}

# ──────────────────────────────────────────────
# Storage
# ──────────────────────────────────────────────
variable "storage_replication_type" {
  description = "Storage replication type (LRS, GRS, RAGRS)"
  type        = string
  default     = "LRS"
}

# ──────────────────────────────────────────────
# Redis
# ──────────────────────────────────────────────
variable "redis_sku_name" {
  description = "Redis SKU name (Basic, Standard, Premium)"
  type        = string
  default     = "Basic"
}

variable "redis_family" {
  description = "Redis family (C for Basic/Standard, P for Premium)"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Redis cache size (0-6)"
  type        = number
  default     = 0
}

# ──────────────────────────────────────────────
# Monitoring
# ──────────────────────────────────────────────
variable "log_retention_days" {
  description = "Log Analytics retention in days"
  type        = number
  default     = 30
}

# ──────────────────────────────────────────────
# Secrets (passed via TF_VAR_ environment variables)
# ──────────────────────────────────────────────
variable "cosmos_key" {
  description = "CosmosDB primary key (set via TF_VAR_cosmos_key)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key (set via TF_VAR_openai_api_key)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth client ID (set via TF_VAR_google_client_id)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret (set via TF_VAR_google_client_secret)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT signing secret (set via TF_VAR_jwt_secret)"
  type        = string
  sensitive   = true
  default     = ""
}
