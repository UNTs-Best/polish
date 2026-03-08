# Polish Infrastructure

Azure infrastructure for the Polish app (Next.js frontend + Express API), managed with Terraform.

## Environments

| Environment | Branch   | Backend State Key         |
|-------------|----------|---------------------------|
| dev         | develop  | polish-dev.tfstate        |
| test        | test     | polish-test.tfstate       |
| stage       | staging  | polish-stage.tfstate      |
| prod        | main     | polish-prod.tfstate       |

## Prerequisites

- Terraform >= 1.5.0
- Azure CLI (`az login`)
- Azure service principal or managed identity for CI/CD

## Usage

```bash
cd infrastructure/terraform

# Initialize (one-time per env)
terraform init -backend-config="key=polish-dev.tfstate"

# Plan
terraform plan -var-file="environments/dev.tfvars"

# Apply (after review)
terraform apply -var-file="environments/dev.tfvars"
```

## Modules

- **resource_group** – Azure resource group
- **monitoring** – Log Analytics, Application Insights
- **cosmosdb** – CosmosDB account, SQL database, containers
- **storage** – Storage account, blob containers
- **redis** – Azure Cache for Redis
- **container_registry** – ACR for Docker images
- **container_app** – Container Apps (Express API)
- **app_service** – App Service (Next.js)

## Required Secrets (CI/CD)

- `ARM_SUBSCRIPTION_ID`, `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_TENANT_ID` – Terraform Azure auth
- `TF_VAR_subscription_id` – passed as Terraform variable
