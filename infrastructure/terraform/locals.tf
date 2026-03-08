locals {
  # Naming convention: {project}-{environment}-{resource}
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge({
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }, local.cost_tags)

  # Cost allocation and governance
  cost_tags = {
    CostCenter = var.project
    Owner      = "platform-team"
  }

  # CosmosDB container definitions — matches server/src/config/db.js
  cosmosdb_containers = [
    {
      name          = "Documents"
      partition_key = "/ownerId"
    },
    {
      name          = "Versions"
      partition_key = "/ownerId"
    },
    {
      name          = "Users"
      partition_key = "/id"
    },
    {
      name          = "Sessions"
      partition_key = "/userId"
    },
    {
      name          = "AIInteractions"
      partition_key = "/userId"
    },
  ]
}
