# Déploiement Kubernetes — MedConnect

Manifests K8s pour démontrer **orchestration**, **load-balancing** et **tolérance aux pannes** sur un cluster de production.

## Contenu

| Fichier | Rôle |
|---|---|
| `00-namespace.yaml` | Namespace `medconnect` isolé |
| `01-configmap.yaml` | ConfigMap + Secret partagés (variables non-sensibles vs secrets) |
| `appointment-service.yaml` | Spring Boot — Deployment + Service + HPA + PDB |
| `medical-records-service.yaml` | Node.js — Deployment + Service + HPA + PDB |
| `api-gateway.yaml` | Spring Cloud Gateway — Deployment + Service `LoadBalancer` + HPA |

## Fonctionnalités démontrées

| Critère | Comment |
|---|---|
| **Orchestration** | Deployment avec `RollingUpdate` (`maxUnavailable: 0` = zero-downtime) |
| **Load balancing** | Service ClusterIP + Spring Cloud LoadBalancer côté gateway ventilant entre les pods |
| **Auto-scaling** | HorizontalPodAutoscaler (CPU 70%, mémoire 80%) — passe de 2 à 8 pods |
| **Tolérance aux pannes** | `startupProbe` + `readinessProbe` + `livenessProbe` + `PodDisruptionBudget` (1 pod min toujours up) |
| **Configuration** | ConfigMap pour vars publiques, Secret pour mots de passe |
| **Monitoring** | Annotations Prometheus (`prometheus.io/scrape: "true"`) |

## Déploiement (pré-requis : metrics-server pour le HPA)

```bash
# 1. Pousser les images dans un registre accessible
docker tag projetwebdustribie-appointment-service       medconnect/appointment-service:1.0.0
docker tag projetwebdustribie-medical-records-service   medconnect/medical-records-service:1.0.0
docker tag projetwebdustribie-api-gateway               medconnect/api-gateway:1.0.0
docker push medconnect/appointment-service:1.0.0
docker push medconnect/medical-records-service:1.0.0
docker push medconnect/api-gateway:1.0.0

# 2. Déployer
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/appointment-service.yaml
kubectl apply -f k8s/medical-records-service.yaml
kubectl apply -f k8s/api-gateway.yaml

# 3. Vérifier
kubectl -n medconnect get pods,svc,hpa,pdb
kubectl -n medconnect logs -l app=appointment-service --tail=50 -f

# 4. Tester l'auto-scaling
kubectl -n medconnect run --rm -it loadgen --image=busybox -- \
  sh -c "while true; do wget -q -O- http://api-gateway:8080/actuator/health; done"

# Dans un autre terminal, observer la montée :
kubectl -n medconnect get hpa appointment-service-hpa --watch
```

## Tester sur KillerCoda (gratuit, sans inscription)

1. Aller sur **https://killercoda.com/playgrounds/scenario/kubernetes**
2. Uploader les manifests : `kubectl apply -f <url-raw-github>`
3. Substituer `LoadBalancer` par `NodePort` dans `api-gateway.yaml`
4. Accéder via l'IP publique fournie par KillerCoda
