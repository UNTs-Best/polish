resource "azurerm_container_registry" "this" {
  # ACR names: 5-50 chars, alphanumeric only
  name                = replace("${var.name_prefix}acr", "-", "")
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = var.tags
}
