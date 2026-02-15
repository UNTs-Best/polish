resource "azurerm_cosmosdb_account" "this" {
  name                = "${var.name_prefix}-cosmos"
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"
  enable_free_tier    = var.enable_free_tier

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  tags = var.tags
}

resource "azurerm_cosmosdb_sql_database" "this" {
  name                = "${var.name_prefix}-db"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
}

resource "azurerm_cosmosdb_sql_container" "containers" {
  count = length(var.containers)

  name                = var.containers[count.index].name
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.this.name
  database_name       = azurerm_cosmosdb_sql_database.this.name
  partition_key_paths = [var.containers[count.index].partition_key]

  # Fixed throughput
  dynamic "autoscale_settings" {
    for_each = var.throughput_mode == "autoscale" ? [1] : []
    content {
      max_throughput = var.throughput
    }
  }

  throughput = var.throughput_mode == "fixed" ? var.throughput : null
}
