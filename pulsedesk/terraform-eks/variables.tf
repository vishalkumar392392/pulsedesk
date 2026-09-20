variable "aws_region" {
  description = "AWS region for the EKS cluster (docx uses us-east-2)."
  type        = string
  default     = "us-east-2"
}

variable "cluster_name" {
  description = "EKS cluster name."
  type        = string
  default     = "backend-eks"
}

variable "cluster_version" {
  description = "Kubernetes version."
  type        = string
  default     = "1.35"
}

variable "nodegroup_name" {
  description = "Managed nodegroup name."
  type        = string
  default     = "backend-ng"
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes."
  type        = string
  default     = "t3.medium"
}

variable "node_desired_size" {
  description = "Desired worker count."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Min worker count."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Max worker count."
  type        = number
  default     = 2
}

variable "vpc_cidr" {
  description = "CIDR for the new VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "namespaces" {
  description = "Application namespaces to create."
  type        = list(string)
  default     = ["dev", "uat", "prod"]
}

variable "service_account_name" {
  description = "IRSA service account name (one per namespace)."
  type        = string
  default     = "backend-sa"
}

variable "secrets_manager_secret_name_prefix" {
  description = "Prefix of Secrets Manager secrets the pods can read."
  type        = string
  default     = "backend-"
}

variable "jenkins_build_slave_role_name" {
  description = "Name of the IAM role attached to the Jenkins build slave (mapped into aws-auth)."
  type        = string
  default     = "eksctl"
}

variable "aws_load_balancer_controller_service_account_name" {
  description = "Kubernetes service account name used by AWS Load Balancer Controller."
  type        = string
  default     = "aws-load-balancer-controller"
}

variable "aws_load_balancer_controller_chart_version" {
  description = "Pinned aws-load-balancer-controller Helm chart version."
  type        = string
  default     = "1.14.1"
}

variable "tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default = {
    Project   = "backend"
    ManagedBy = "terraform"
  }
}
