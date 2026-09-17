# Replaces:
#   eksctl create cluster \
#     --name backend-eks --region us-east-2 --version 1.31 \
#     --nodegroup-name backend-ng --node-type t3.medium \
#     --nodes 2 --nodes-min 2 --nodes-max 2 --managed --with-oidc

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.24"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  enable_irsa = true

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  eks_managed_node_groups = {
    (var.nodegroup_name) = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = [var.node_instance_type]

      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size

      capacity_type = "ON_DEMAND"
    }
  }

  # v20 of this module uses EKS access entries instead of the aws-auth
  # ConfigMap. This grants the Jenkins build-slave IAM role cluster-admin,
  # the equivalent of the old `system:masters` mapping.
  authentication_mode                      = "API_AND_CONFIG_MAP"
  enable_cluster_creator_admin_permissions = true

  access_entries = {
    jenkins_build_slave = {
      principal_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.jenkins_build_slave_role_name}"

      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }

  tags = var.tags
}
