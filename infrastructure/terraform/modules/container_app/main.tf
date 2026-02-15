resource "azurerm_container_app_environment" "this" {
  name                       = "${var.name_prefix}-cae"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = var.log_analytics_workspace_id

  tags = var.tags
}

resource "azurerm_container_app" "backend" {
  name                         = "${var.name_prefix}-api"
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  secret {
    name  = "acr-password"
    value = var.acr_admin_pass
  }

  secret {
    name  = "cosmos-key"
    value = var.cosmos_key
  }

  secret {
    name  = "storage-connection"
    value = var.storage_connection
  }

  secret {
    name  = "redis-connection"
    value = var.redis_connection
  }

  secret {
    name  = "openai-api-key"
    value = var.openai_api_key
  }

  secret {
    name  = "google-client-id"
    value = var.google_client_id
  }

  secret {
    name  = "google-client-secret"
    value = var.google_client_secret
  }

  secret {
    name  = "jwt-secret"
    value = var.jwt_secret
  }

  registry {
    server               = var.acr_login_server
    username             = var.acr_admin_user
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = true
    target_port      = 5000

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = var.container_min_replicas
    max_replicas = var.container_max_replicas

    container {
      name   = "express-server"
      image  = "${var.acr_login_server}/${var.name_prefix}-api:latest"
      cpu    = var.container_cpu
      memory = var.container_memory

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "5000"
      }

      env {
        name  = "COSMOS_ENDPOINT"
        value = var.cosmos_endpoint
      }

      env {
        name        = "COSMOS_KEY"
        secret_name = "cosmos-key"
      }

      env {
        name  = "COSMOS_DATABASE"
        value = var.cosmos_database
      }

      env {
        name        = "AZURE_STORAGE_CONNECTION_STRING"
        secret_name = "storage-connection"
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-connection"
      }

      env {
        name        = "OPENAI_API_KEY"
        secret_name = "openai-api-key"
      }

      env {
        name        = "GOOGLE_CLIENT_ID"
        secret_name = "google-client-id"
      }

      env {
        name        = "GOOGLE_CLIENT_SECRET"
        secret_name = "google-client-secret"
      }

      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }

      env {
        name  = "APPINSIGHTS_INSTRUMENTATIONKEY"
        value = var.app_insights_key
      }

      liveness_probe {
        transport = "HTTP"
        path      = "/api/health"
        port      = 5000
      }

      readiness_probe {
        transport = "HTTP"
        path      = "/api/health"
        port      = 5000
      }
    }
  }

  tags = var.tags
}
