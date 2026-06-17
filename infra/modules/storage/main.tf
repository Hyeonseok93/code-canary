locals {
  tags = merge(var.tags, {
    Module = "storage"
  })
}

resource "aws_security_group" "efs" {
  name        = "${var.name_prefix}-efs"
  description = "EFS NFS for pipeline staging"
  vpc_id      = var.vpc_id

  tags = merge(local.tags, {
    Name = "${var.name_prefix}-efs"
  })
}

resource "aws_vpc_security_group_ingress_rule" "efs_from_ecs" {
  security_group_id            = aws_security_group.efs.id
  description                  = "NFS from ECS tasks"
  from_port                    = 2049
  to_port                      = 2049
  ip_protocol                  = "tcp"
  referenced_security_group_id = var.ecs_security_group_id
}

resource "aws_vpc_security_group_egress_rule" "efs_all" {
  security_group_id = aws_security_group.efs.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_efs_file_system" "pipeline" {
  creation_token = "${var.name_prefix}-pipeline"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = var.transition_to_ia
  }

  tags = merge(local.tags, {
    Name = "${var.name_prefix}-pipeline"
  })
}

resource "aws_efs_mount_target" "pipeline" {
  count = length(var.subnet_ids)

  file_system_id  = aws_efs_file_system.pipeline.id
  subnet_id       = var.subnet_ids[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_access_point" "pipeline" {
  file_system_id = aws_efs_file_system.pipeline.id

  posix_user {
    gid = var.posix_gid
    uid = var.posix_uid
  }

  root_directory {
    path = "/pipeline"
    creation_info {
      owner_gid   = var.posix_gid
      owner_uid   = var.posix_uid
      permissions = "0775"
    }
  }

  tags = merge(local.tags, {
    Name = "${var.name_prefix}-pipeline-ap"
  })
}
