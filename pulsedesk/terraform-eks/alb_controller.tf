# The controller owns AWS ALBs that are requested by Kubernetes Ingress objects.
# Do not add an aws_lb resource for application traffic: that would compete with
# the controller's reconciliation loop.
module "irsa_aws_load_balancer_controller" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.44"

  role_name                              = "${var.cluster_name}-aws-load-balancer-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn = module.eks.oidc_provider_arn
      namespace_service_accounts = [
        "kube-system:${var.aws_load_balancer_controller_service_account_name}",
      ]
    }
  }

  tags = var.tags
}

# Create the service account separately so Terraform owns the IRSA annotation.
# The Helm chart is deliberately configured not to create a second account.
resource "kubernetes_service_account" "aws_load_balancer_controller" {
  metadata {
    name      = var.aws_load_balancer_controller_service_account_name
    namespace = "kube-system"
    annotations = {
      "eks.amazonaws.com/role-arn" = module.irsa_aws_load_balancer_controller.iam_role_arn
    }
  }

  depends_on = [time_sleep.wait_for_eks_access]
}

resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"

  # Pin the chart so controller upgrades are explicit Terraform changes.
  version = var.aws_load_balancer_controller_chart_version

  # Initial EKS control-plane and chart-image startup can exceed Helm's five
  # minute default. Atomic installs leave no partially-installed release.
  timeout         = 900
  wait            = true
  atomic          = true
  cleanup_on_fail = true

  set {
    name  = "clusterName"
    value = module.eks.cluster_name
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "vpcId"
    value = module.vpc.vpc_id
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = kubernetes_service_account.aws_load_balancer_controller.metadata[0].name
  }

  depends_on = [kubernetes_service_account.aws_load_balancer_controller]
}
