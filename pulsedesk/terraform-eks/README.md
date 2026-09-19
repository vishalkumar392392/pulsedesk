# Backend EKS Terraform

This Terraform stack creates a standalone backend EKS cluster based on the EventCart EKS setup, with backend-oriented resource names.

## What It Creates

- EKS cluster: `backend-eks`
- Managed node group: `backend-ng`
- VPC: `backend-eks-vpc`
- Namespaces: `dev`, `uat`, `prod`
- IRSA service account in each namespace: `backend-sa`
- IAM policy for Secrets Manager reads: `backend-eks-secrets-manager-policy`
- Secrets Store CSI driver and AWS provider Helm releases
- AWS Load Balancer Controller in `kube-system`, with a dedicated IRSA role
- Jenkins build-slave EKS admin access entry, using `var.jenkins_build_slave_role_name`

By default, pods using `backend-sa` can read Secrets Manager secrets whose names start with `backend-`.
Override `secrets_manager_secret_name_prefix` if your backend secrets use a different prefix.

Application manifests remain deployed by Jenkins. Each application uses a
`ClusterIP` Service and an `Ingress` with
`alb.ingress.kubernetes.io/group.name: pulsedesk`; this makes the controller
create one shared internet-facing ALB instead of an NLB per application. The
ALB starts with its HTTP listener only. ACM certificate creation, HTTPS listener
configuration, and Cloudflare DNS/SSL configuration are intentionally manual.

## Usage

```bash
cd /Users/apple/Desktop/Pulse/pulsedesk/terraform-eks
terraform init
terraform plan
terraform apply
```

After apply:

```bash
aws eks update-kubeconfig --region us-east-2 --name backend-eks
```

Or use the `update_kubeconfig_command` Terraform output.
