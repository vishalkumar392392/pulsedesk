# Replaces the manual IAM policy `backend-eks-secrets-manager-policy` from the doc.
data "aws_iam_policy_document" "secrets_manager_read" {
  statement {
    sid    = "AllowSecretRead"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
    ]
    resources = [
      "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.secrets_manager_secret_name_prefix}*",
    ]
  }
}

resource "aws_iam_policy" "eks_secrets_manager" {
  name        = "backend-eks-secrets-manager-policy"
  description = "Read access to Secrets Manager secrets used by EKS workloads"
  policy      = data.aws_iam_policy_document.secrets_manager_read.json
  tags        = var.tags
}

# Replaces:
#   eksctl create iamserviceaccount \
#     --cluster backend-eks --region us-east-2 \
#     --name backend-sa --namespace dev \
#     --attach-policy-arn arn:aws:iam::<acct>:policy/backend-eks-secrets-manager-policy \
#     --approve
#
# eksctl only created this in the `dev` namespace; we use for_each so it can
# easily be extended to uat/prod by adding them to `irsa_namespaces`.
variable "irsa_namespaces" {
  description = "Namespaces in which to create the IRSA service account."
  type        = list(string)
  default     = ["dev", "uat", "prod"]
}

module "irsa_backend_sa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.44"

  for_each = toset(var.irsa_namespaces)

  role_name = "${var.cluster_name}-${each.value}-${var.service_account_name}"

  role_policy_arns = {
    secrets_manager = aws_iam_policy.eks_secrets_manager.arn
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["${each.value}:${var.service_account_name}"]
    }
  }

  tags = var.tags
}

resource "kubernetes_service_account" "backend_sa" {
  for_each = toset(var.irsa_namespaces)

  metadata {
    name      = var.service_account_name
    namespace = each.value
    annotations = {
      "eks.amazonaws.com/role-arn" = module.irsa_backend_sa[each.value].iam_role_arn
    }
  }

  depends_on = [kubernetes_namespace.app]
}
