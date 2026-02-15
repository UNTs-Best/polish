resource "azurerm_service_plan" "this" {
  name                = "${var.name_prefix}-plan"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.sku_name

  tags = var.tags
}

resource "azurerm_linux_web_app" "this" {
  name                = "${var.name_prefix}-web"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.this.id
  https_only          = true

  site_config {
    application_stack {
      node_version = "18-lts"
    }

    app_command_line = "npm run start"
    always_on        = var.sku_name != "F1"
  }

  app_settings = {
    "NEXT_PUBLIC_API_URL"                   = "https://${var.backend_url}"
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = var.app_insights_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.app_insights_conn
  }

  tags = var.tags
}
