cd /Users/apple/Desktop/Pulse/pulsedesk/terraform-eks

# ============================================================

# 1. CONNECT TO EKS

# ============================================================

aws eks update-kubeconfig \
 --region us-east-2 \
 --name backend-eks

kubectl get nodes

# ============================================================

# 2. CHECK AND DELETE INGRESS

# ============================================================

kubectl get ingress -A

kubectl delete ingress --all -A --wait=true

# If the above command is stuck, press:

# Ctrl+C

kubectl get ingress -A

# If pulsedesk ingress is stuck because of finalizers:

kubectl patch ingress pulsedesk \
 -n dev \
 --type=json \
 -p='[{"op":"remove","path":"/metadata/finalizers"}]'

kubectl get ingress -A

# ============================================================

# 3. DELETE APPLICATION DEPLOYMENTS AND SERVICES

# ============================================================

kubectl delete deployment,service --all -n dev
kubectl delete deployment,service --all -n uat
kubectl delete deployment,service --all -n prod

kubectl get svc -A

# ============================================================

# 4. CHECK TARGET GROUP BINDINGS

# ============================================================

kubectl get targetgroupbindings.elbv2.k8s.aws -A

# If a TargetGroupBinding is stuck, remove its finalizer:

kubectl patch targetgroupbinding \
 -n dev \
 k8s-dev-pulsedes-f13fbc6a48 \
 --type=json \
 -p='[{"op":"remove","path":"/metadata/finalizers"}]'

kubectl get targetgroupbindings.elbv2.k8s.aws -A

# ============================================================

# 5. DELETE STUCK DEV NAMESPACE IF NECESSARY

# ============================================================

kubectl get namespace dev

kubectl get namespace dev -o json | jq '.spec.finalizers=[]' > /tmp/dev.json

kubectl replace --raw "/api/v1/namespaces/dev/finalize" \
 -f /tmp/dev.json

kubectl get namespace

# ============================================================

# 6. VERIFY AWS LOAD BALANCERS ARE GONE

# ============================================================

aws elbv2 describe-load-balancers \
 --region us-east-2 \
 --query 'LoadBalancers[*].[LoadBalancerName,Type,State.Code,VpcId]' \
 --output table

# ============================================================

# 7. VERIFY VPC NETWORK INTERFACES

# ============================================================

aws ec2 describe-network-interfaces \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'NetworkInterfaces[*].[NetworkInterfaceId,SubnetId,Description,Status,InterfaceType,RequesterManaged]' \
 --output table

# ============================================================

# 8. CHECK EC2 INSTANCES

# ============================================================

aws ec2 describe-instances \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'Reservations[*].Instances[*].[InstanceId,State.Name,SubnetId,PrivateIpAddress,PublicIpAddress]' \
 --output table

# ============================================================

# 9. CHECK NAT GATEWAYS

# ============================================================

aws ec2 describe-nat-gateways \
 --region us-east-2 \
 --filter "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'NatGateways[*].[NatGatewayId,State,SubnetId]' \
 --output table

# ============================================================

# 10. CHECK VPC ENDPOINTS

# ============================================================

aws ec2 describe-vpc-endpoints \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'VpcEndpoints[*].[VpcEndpointId,VpcEndpointType,ServiceName,State]' \
 --output table

# ============================================================

# 11. CHECK INTERNET GATEWAY

# ============================================================

aws ec2 describe-internet-gateways \
 --region us-east-2 \
 --filters "Name=attachment.vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'InternetGateways[*].[InternetGatewayId,Attachments[0].State]' \
 --output table

# ============================================================

# 12. CHECK EIPs

# ============================================================

aws ec2 describe-addresses \
 --region us-east-2 \
 --query 'Addresses[*].[AllocationId,PublicIp,AssociationId,InstanceId,NetworkInterfaceId]' \
 --output table

# ============================================================

# 13. CHECK SUBNETS

# ============================================================

aws ec2 describe-subnets \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'Subnets[*].[SubnetId,AvailabilityZone,State]' \
 --output table

# ============================================================

# 14. CHECK ROUTE TABLES

# ============================================================

aws ec2 describe-route-tables \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'RouteTables[*].[RouteTableId,Associations]' \
 --output json

# ============================================================

# 15. CHECK SECURITY GROUPS

# ============================================================

aws ec2 describe-security-groups \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'SecurityGroups[*].[GroupId,GroupName]' \
 --output table

# ============================================================

# 16. CHECK VPC PEERING

# ============================================================

aws ec2 describe-vpc-peering-connections \
 --region us-east-2 \
 --filters "Name=requester-vpc-info.vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'VpcPeeringConnections[*].[VpcPeeringConnectionId,Status.Code,AccepterVpcInfo.VpcId]' \
 --output table

# ============================================================

# 17. CHECK NETWORK ACLS

# ============================================================

aws ec2 describe-network-acls \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'NetworkAcls[*].[NetworkAclId,IsDefault]' \
 --output table

# ============================================================

# 18. CHECK VPN GATEWAYS

# ============================================================

aws ec2 describe-vpn-gateways \
 --region us-east-2 \
 --filters "Name=attachment.vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'VpnGateways[*].[VpnGatewayId,State]' \
 --output table

# ============================================================

# 19. CHECK TRANSIT GATEWAY ATTACHMENTS

# ============================================================

aws ec2 describe-transit-gateway-vpc-attachments \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'TransitGatewayVpcAttachments[*].[TransitGatewayAttachmentId,State,TransitGatewayId]' \
 --output table

# ============================================================

# 20. TERRAFORM DESTROY PLAN

# ============================================================

terraform plan -destroy

# ============================================================

# 21. TERRAFORM DESTROY

# ============================================================

terraform destroy -auto-approve

# ============================================================

# 22. IF TERRAFORM GETS STUCK ON VPC DELETE

# CHECK KUBERNETES-CREATED SECURITY GROUPS

# ============================================================

aws ec2 describe-security-groups \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'SecurityGroups[*].[GroupId,GroupName,Description]' \
 --output table

# If these specific Kubernetes security groups are still present

# AFTER EKS has been deleted, delete them:

aws ec2 delete-security-group \
 --region us-east-2 \
 --group-id sg-074f70e71ef06fbe6

aws ec2 delete-security-group \
 --region us-east-2 \
 --group-id sg-0ef15935cc3b54789

# Verify:

aws ec2 describe-security-groups \
 --region us-east-2 \
 --filters "Name=vpc-id,Values=vpc-0188eef3afa8263ec" \
 --query 'SecurityGroups[*].[GroupId,GroupName]' \
 --output table

# Then retry:

terraform destroy -auto-approve

# ============================================================

# 23. CHECK TERRAFORM STATE

# ============================================================

terraform state list

# ============================================================

# 24. VERIFY VPC IS DELETED

# ============================================================

aws ec2 describe-vpcs \
 --region us-east-2 \
 --vpc-ids vpc-0188eef3afa8263ec

# ============================================================

# 25. VERIFY EKS IS DELETED

# ============================================================

aws eks describe-cluster \
 --region us-east-2 \
 --name backend-eks
