# CosmosDB account name: lowercase, 3-44 chars, globally unique
locals {
  account_name = "${replace(lower(var.name_prefix), "-", "")}cosmos"
}

resource "azurerm_cosmosdb_account" "this" {
  name                = local.account_name
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  free_tier_enabled = var.enable_free_tier

  tags = var.tags
}

resource "azurerm_cosmosdb_sql_database" "this" {
  name                = "${var.name_prefix}-db"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name

  dynamic "autoscale_settings" {
    for_each = var.throughput_mode == "autoscale" ? [1] : []
    content {
      max_throughput = var.throughput
    }
  }

  throughput = var.throughput_mode == "fixed" ? var.throughput : null
}

resource "azurerm_cosmosdb_sql_container" "containers" {
  for_each = { for c in var.containers : c.name => c }

  name                = each.value.name
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
  database_name       = azurerm_cosmosdb_sql_database.this.name
  partition_key_path  = each.value.partition_key
}
