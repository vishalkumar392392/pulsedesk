output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_oidc_provider_arn" {
  value = module.eks.oidc_provider_arn
}

output "region" {
  value = var.aws_region
}

# Run this after `terraform apply` to wire up kubectl, replacing:
#   aws eks update-kubeconfig --region us-east-2 --name backend-eks
output "update_kubeconfig_command" {
  value = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "irsa_role_arns" {
  description = "IRSA role ARN per namespace for the backend-sa service account."
  value       = { for k, m in module.irsa_backend_sa : k => m.iam_role_arn }
}
