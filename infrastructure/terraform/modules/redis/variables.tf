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
  description = "Redis SKU name (Basic, Standard, Premium)"
  type        = string
  default     = "Basic"
}

variable "family" {
  description = "Redis family (C for Basic/Standard, P for Premium)"
  type        = string
  default     = "C"
}

variable "capacity" {
  description = "Redis cache size (0-6)"
  type        = number
  default     = 0
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
