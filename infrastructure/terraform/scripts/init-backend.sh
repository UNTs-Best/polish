#!/usr/bin/env bash
#
# One-time bootstrap: creates the Azure Storage resources used for
# Terraform remote state. Run this once before the first `terraform init`.
#
# Usage:
#   ./init-backend.sh
#
# Prerequisites:
#   - Azure CLI installed and logged in (`az login`)
#   - Subscription set (`az account set --subscription <id>`)
#

set -euo pipefail

RESOURCE_GROUP="polish-tfstate-rg"
STORAGE_ACCOUNT="polishtfstate"
CONTAINER_NAME="tfstate"
LOCATION="eastus"

echo "Creating resource group: ${RESOURCE_GROUP}"
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}"

echo "Creating storage account: ${STORAGE_ACCOUNT}"
az storage account create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT}" \
  --sku Standard_LRS \
  --encryption-services blob \
  --min-tls-version TLS1_2

echo "Creating blob container: ${CONTAINER_NAME}"
az storage container create \
  --name "${CONTAINER_NAME}" \
  --account-name "${STORAGE_ACCOUNT}"

echo ""
echo "Backend storage is ready. Initialize Terraform with:"
echo ""
echo '  terraform init -backend-config="key=polish-dev.tfstate"'
echo ""
