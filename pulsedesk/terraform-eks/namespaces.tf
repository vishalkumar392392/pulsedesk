# Replaces: kubectl create namespace {dev,uat,prod}
resource "kubernetes_namespace" "app" {
  for_each = toset(var.namespaces)

  metadata {
    name = each.value
  }

  depends_on = [module.eks]
}
