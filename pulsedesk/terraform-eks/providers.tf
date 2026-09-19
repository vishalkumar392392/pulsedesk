provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# EKS access entries are eventually consistent immediately after a new cluster
# is created. Kubernetes and Helm resources wait for that authorization to be
# usable rather than racing the control-plane bootstrap.
resource "time_sleep" "wait_for_eks_access" {
  create_duration = "45s"

  depends_on = [module.eks]
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  # Generate a token for each provider operation. A data-source token is fixed
  # at Terraform evaluation time and can be invalid during a long initial apply.
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_name,
      "--region",
      var.aws_region,
    ]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks.cluster_name,
        "--region",
        var.aws_region,
      ]
    }
  }
}
