# Go to the Terraform EKS project directory
cd /Users/apple/Desktop/Pulse/pulsedesk/terraform-eks

# Configure kubectl to communicate with the backend-eks cluster
aws eks update-kubeconfig --region us-east-2 --name backend-eks

# Verify that the EKS worker nodes are currently available
kubectl get nodes

# Check whether any Kubernetes Ingress resources are still present
kubectl get ingress -A

# Delete all Kubernetes Ingress resources and wait for AWS Load Balancer Controller cleanup
kubectl delete ingress --all -A --wait=true

# Verify that all Ingress resources have been removed
kubectl get ingress -A

# Remove the finalizer if the Pulsedesk Ingress is stuck during deletion
kubectl patch ingress pulsedesk -n dev --type=json -p='[{"op":"remove","path":"/metadata/finalizers"}]'

# Verify that the Pulsedesk Ingress is no longer present
kubectl get ingress -A

# Delete all application Deployments and Services from the dev namespace
kubectl delete deployment,service --all -n dev

# Delete all application Deployments and Services from the uat namespace
kubectl delete deployment,service --all -n uat

# Delete all application Deployments and Services from the prod namespace
kubectl delete deployment,service --all -n prod

# Verify that no application LoadBalancer or other Services remain
kubectl get svc -A

# Check whether any AWS Load Balancer Controller TargetGroupBindings remain
kubectl get targetgroupbindings.elbv2.k8s.aws -A

# Remove the finalizer if a TargetGroupBinding is stuck during deletion
kubectl patch targetgroupbinding -n dev k8s-dev-pulsedes-f13fbc6a48 --type=json -p='[{"op":"remove","path":"/metadata/finalizers"}]'

# Verify that no TargetGroupBindings remain
kubectl get targetgroupbindings.elbv2.k8s.aws -A

# Check whether the dev namespace still exists
kubectl get namespace dev

# Remove namespace finalizers from the dev namespace if it is stuck terminating
kubectl get namespace dev -o json | jq '.spec.finalizers=[]' > /tmp/dev.json

# Force Kubernetes to finalize and remove the stuck dev namespace
kubectl replace --raw "/api/v1/namespaces/dev/finalize" -f /tmp/dev.json

# Verify the current Kubernetes namespaces
kubectl get namespace

# Verify that no AWS Application or Network Load Balancers remain
aws elbv2 describe-load-balancers --region us-east-2 --query 'LoadBalancers[*].[LoadBalancerName,Type,State.Code,VpcId]' --output table

# Check for remaining network interfaces inside the EKS VPC
aws ec2 describe-network-interfaces --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'NetworkInterfaces[*].[NetworkInterfaceId,SubnetId,Description,Status,InterfaceType,RequesterManaged]' --output table

# Check whether any EC2 instances are still running inside the EKS VPC
aws ec2 describe-instances --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'Reservations[*].Instances[*].[InstanceId,State.Name,SubnetId,PrivateIpAddress,PublicIpAddress]' --output table

# Check the NAT Gateways that still exist inside the EKS VPC
aws ec2 describe-nat-gateways --region us-east-2 --filter "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'NatGateways[*].[NatGatewayId,State,SubnetId]' --output table

# Check whether any VPC endpoints remain
aws ec2 describe-vpc-endpoints --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'VpcEndpoints[*].[VpcEndpointId,VpcEndpointType,ServiceName,State]' --output table

# Check whether the Internet Gateway is still attached to the EKS VPC
aws ec2 describe-internet-gateways --region us-east-2 --filters "Name=attachment.vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'InternetGateways[*].[InternetGatewayId,Attachments[0].State]' --output table

# Check Elastic IP addresses that may be associated with the NAT Gateway or other resources
aws ec2 describe-addresses --region us-east-2 --query 'Addresses[*].[AllocationId,PublicIp,AssociationId,InstanceId,NetworkInterfaceId]' --output table

# Check whether any subnets remain inside the EKS VPC
aws ec2 describe-subnets --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'Subnets[*].[SubnetId,AvailabilityZone,State]' --output table

# Check the VPC route tables and their subnet associations
aws ec2 describe-route-tables --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'RouteTables[*].[RouteTableId,Associations]' --output json

# Check security groups that still exist inside the EKS VPC
aws ec2 describe-security-groups --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'SecurityGroups[*].[GroupId,GroupName]' --output table

# Check whether any VPC peering connections are attached to the EKS VPC
aws ec2 describe-vpc-peering-connections --region us-east-2 --filters "Name=requester-vpc-info.vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'VpcPeeringConnections[*].[VpcPeeringConnectionId,Status.Code,AccepterVpcInfo.VpcId]' --output table

# Check the Network ACLs associated with the EKS VPC
aws ec2 describe-network-acls --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'NetworkAcls[*].[NetworkAclId,IsDefault]' --output table

# Check whether any VPN Gateway is attached to the EKS VPC
aws ec2 describe-vpn-gateways --region us-east-2 --filters "Name=attachment.vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'VpnGateways[*].[VpnGatewayId,State]' --output table

# Check whether any Transit Gateway attachment is associated with the EKS VPC
aws ec2 describe-transit-gateway-vpc-attachments --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'TransitGatewayVpcAttachments[*].[TransitGatewayAttachmentId,State,TransitGatewayId]' --output table

# Preview everything Terraform intends to delete before actually destroying the infrastructure
terraform plan -destroy

# Destroy the Terraform-managed EKS, EC2, networking, and supporting AWS infrastructure
terraform destroy -auto-approve

# If Terraform gets stuck while deleting the VPC, check which security groups remain
aws ec2 describe-security-groups --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'SecurityGroups[*].[GroupId,GroupName,Description]' --output table

# Delete the Kubernetes-created security group ONLY if EKS has already been completely deleted and Terraform is blocked by this group
aws ec2 delete-security-group --region us-east-2 --group-id sg-074f70e71ef06fbe6

# Delete the second Kubernetes-created security group ONLY if EKS has already been completely deleted and Terraform is blocked by this group
aws ec2 delete-security-group --region us-east-2 --group-id sg-0ef15935cc3b54789

# Verify that the manually removed security groups are gone
aws ec2 describe-security-groups --region us-east-2 --filters "Name=vpc-id,Values=vpc-0cfefe7c3a8f1e0d7" --query 'SecurityGroups[*].[GroupId,GroupName]' --output table

# Retry Terraform destruction after removing any remaining blocking security groups
terraform destroy -auto-approve

# Show the remaining Terraform resources; an empty result means Terraform state has no resources left
terraform state list

# Verify that the EKS VPC has been completely deleted
aws ec2 describe-vpcs --region us-east-2 --vpc-ids vpc-0cfefe7c3a8f1e0d7

# Verify that the EKS cluster has been completely deleted
aws eks describe-cluster --region us-east-2 --name backend-eks