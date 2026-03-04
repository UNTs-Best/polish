terraform {
  backend "azurerm" {
    resource_group_name  = "polish-tfstate-rg"
    storage_account_name = "polishtfstate"
    container_name       = "tfstate"
    # key is set via -backend-config="key=polish-{env}.tfstate"
  }
}
