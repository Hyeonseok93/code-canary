locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# Wire modules from ../../modules/ as infrastructure is added (network, ecs, data, …).
