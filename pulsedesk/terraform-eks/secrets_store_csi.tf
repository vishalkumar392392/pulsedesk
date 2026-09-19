# Replaces:
#   helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
#   helm install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
#       --namespace kube-system --set syncSecret.enabled=true --set enableSecretRotation=true
resource "helm_release" "secrets_store_csi_driver" {
  name       = "csi-secrets-store"
  repository = "https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts"
  chart      = "secrets-store-csi-driver"
  namespace  = "kube-system"
  version    = "1.4.6"

  # The Kubernetes API server performs authoritative validation. Skipping
  # Helm's client-side OpenAPI fetch avoids a bootstrap-time API timeout.
  disable_openapi_validation = true
  timeout                    = 900
  wait                       = true
  atomic                     = true
  cleanup_on_fail            = true

  set {
    name  = "syncSecret.enabled"
    value = "true"
  }

  set {
    name  = "enableSecretRotation"
    value = "true"
  }

  depends_on = [time_sleep.wait_for_eks_access]
}

# Replaces:
#   kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
#
# Installed via the official chart so it's version-pinned and managed by Terraform.
resource "helm_release" "secrets_store_csi_aws_provider" {
  name       = "secrets-provider-aws"
  repository = "https://aws.github.io/secrets-store-csi-driver-provider-aws"
  chart      = "secrets-store-csi-driver-provider-aws"
  namespace  = "kube-system"
  version    = "0.3.10"

  timeout         = 900
  wait            = true
  atomic          = true
  cleanup_on_fail = true

  depends_on = [helm_release.secrets_store_csi_driver]
}
