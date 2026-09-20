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

output "vpc_id" {
  value = module.vpc.vpc_id
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

output "aws_load_balancer_controller_irsa_role_arn" {
  description = "IRSA role used by the AWS Load Balancer Controller."
  value       = module.irsa_aws_load_balancer_controller.iam_role_arn
}
