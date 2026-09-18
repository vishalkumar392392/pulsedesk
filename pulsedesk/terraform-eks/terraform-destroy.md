# 1. Configure EKS kubeconfig

aws eks update-kubeconfig --region us-east-2 --name backend-eks

# 2. Check Kubernetes resources

kubectl get all -A
kubectl get svc -A

# 3. Delete LoadBalancer services

kubectl delete svc --all -n dev

# 4. Delete application deployments

kubectl delete deployment --all -n dev

# 5. Verify services

kubectl get svc -A

# 6. Verify AWS Load Balancers

aws elbv2 describe-load-balancers \
 --query 'LoadBalancers[*].[LoadBalancerName,Type,State.Code,VpcId]' \
 --output table

# 7. Verify ENIs

aws ec2 describe-network-interfaces \
 --filters "Name=vpc-id,Values=vpc-0490fa190a7503b7d" \
 --query 'NetworkInterfaces[*].[NetworkInterfaceId,SubnetId,Description,Status]' \
 --output table

# 8. Destroy EKS

terraform destroy -target=module.eks -auto-approve

# 9. Verify EKS is deleted

aws eks list-clusters --region us-east-2

# 10. Check remaining ENIs

aws ec2 describe-network-interfaces \
 --filters "Name=vpc-id,Values=vpc-0490fa190a7503b7d" \
 --query 'NetworkInterfaces[*].[NetworkInterfaceId,SubnetId,Description,Status]' \
 --output table

# 11. Check EC2 instances

aws ec2 describe-instances \
 --filters "Name=vpc-id,Values=vpc-0490fa190a7503b7d" \
 --query 'Reservations[*].Instances[*].[InstanceId,State.Name,SubnetId,PublicIpAddress,PrivateIpAddress]' \
 --output table

# 12. Check NAT Gateways

aws ec2 describe-nat-gateways \
 --filter "Name=vpc-id,Values=vpc-0490fa190a7503b7d" \
 --query 'NatGateways[*].[NatGatewayId,State,SubnetId,NatGatewayAddresses[*].PublicIp]' \
 --output table

# 13. Check Elastic IPs

aws ec2 describe-addresses \
 --query 'Addresses[*].[AllocationId,PublicIp,AssociationId,InstanceId,NetworkInterfaceId,PrivateIpAddress]' \
 --output table

# 14. Destroy remaining infrastructure

terraform destroy -auto-approve

# 15. Verify VPC is deleted

aws ec2 describe-vpcs \
 --vpc-ids vpc-0490fa190a7503b7d
