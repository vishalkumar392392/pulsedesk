# 1. Configure EKS kubeconfig

aws eks update-kubeconfig --region us-east-2 --name backend-eks

# Record values needed for verification before Terraform removes its outputs.
export AWS_REGION="$(terraform output -raw region)"
export VPC_ID="$(terraform output -raw vpc_id)"

# 2. Remove application Ingresses first and wait for the controller to delete
#    the ALB, target groups, security groups, and ENIs. This must happen while
#    both the controller and EKS API are still running.

kubectl delete ingress --all -A --wait=true

# 3. Check Kubernetes resources

kubectl get all -A
kubectl get svc -A

# 4. Delete application deployments and their ClusterIP services in every app
#    namespace. Do not delete kube-system services.

kubectl delete deployment,service --all -n dev
kubectl delete deployment,service --all -n uat
kubectl delete deployment,service --all -n prod

# 5. Verify no ALB-backed Ingress remains

kubectl get ingress -A

# 6. Verify AWS Load Balancers

aws elbv2 describe-load-balancers \
 --region "$AWS_REGION" \
 --query 'LoadBalancers[*].[LoadBalancerName,Type,State.Code,VpcId]' \
 --output table

# 7. Verify ENIs

aws ec2 describe-network-interfaces \
 --region "$AWS_REGION" \
 --filters "Name=vpc-id,Values=$VPC_ID" \
 --query 'NetworkInterfaces[*].[NetworkInterfaceId,SubnetId,Description,Status]' \
 --output table

# 8. Destroy the full Terraform stack in one dependency-aware operation. The
#    Helm controller release is deleted before EKS; EKS and node groups are
#    deleted before the VPC. Do not use -target or manually delete ENIs.

terraform destroy

# 9. Verify VPC is deleted

aws ec2 describe-vpcs \
 --region "$AWS_REGION" \
 --vpc-ids "$VPC_ID"
