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

variable "enable_free_tier" {
  description = "Enable CosmosDB free tier (one per subscription)"
  type        = bool
  default     = false
}

variable "throughput_mode" {
  description = "Throughput mode: fixed or autoscale"
  type        = string
  default     = "fixed"

  validation {
    condition     = contains(["fixed", "autoscale"], var.throughput_mode)
    error_message = "throughput_mode must be 'fixed' or 'autoscale'."
  }
}

variable "throughput" {
  description = "Throughput in RU/s (fixed) or max RU/s (autoscale)"
  type        = number
  default     = 400
}

variable "containers" {
  description = "List of container configs: name, partition_key"
  type = list(object({
    name          = string
    partition_key = string
  }))
  default = []
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
