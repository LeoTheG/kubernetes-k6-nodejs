# Kubernetes + k6 + NodeJS

Sets up a Kubernetes cluster with a NodeJS app and load tests it with k6.

Read on for a technical understanding aimed at beginners.

## Setup

Requires installing minikube https://minikube.sigs.k8s.io/docs/start/

- Allows us to set up a local Kubernetes cluster

Build and deploy

Run `./scripts/build-and-deploy.sh`

In detail:

```bash
eval $(minikube docker-env)
docker build -t my-nodejs-app .
```

call after changing deployment / service

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

view pods status

`kubectl get pods`

view service url

`minikube service my-nodejs-app-service --url`

scale replicas

`kubectl scale deployment my-nodejs-app-deployment --replicas=5`

## Rolling Updates

`./build-and-deploy.sh` - builds the docker image and restarts the deployment with rolling updates

## Load Testing

Install k6: https://k6.io/docs/get-started/installation/

k6 is a load testing tool that can be used to test the performance of our application.

The script is written in `scripts/loadTesting.ts`

To run the load test:

1. Run the cluster

2. `minikube service my-nodejs-app-service --url` to get the service URL

3. Use the URL in the script like: `./scripts/load-test.sh http://127.0.0.1:44557/`

Example output:

```
$ ./load-test.sh http://127.0.0.1:44557/

> kubernetes-nodejs@1.0.0 build
> tsc


          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: dist/scripts/loadTesting.js
     output: -

  scenarios: (100.00%) 1 scenario, 300 max VUs, 45s max duration (incl. graceful stop):
           * default: Up to 300 looping VUs for 15s over 1 stages (gracefulRampDown: 30s, gracefulStop: 30s)


     ✓ status was 200
     ✓ returned same id

     checks.........................: 100.00% ✓ 4770       ✗ 0
     data_received..................: 556 kB  35 kB/s
     data_sent......................: 210 kB  13 kB/s
     http_req_blocked...............: avg=60.52µs min=1.2µs   med=4.1µs  max=41.28ms p(90)=169.47µs p(95)=250.09µs
     http_req_connecting............: avg=42.07µs min=0s      med=0s     max=41.08ms p(90)=108.8µs  p(95)=174.01µs
   ✓ http_req_duration..............: avg=5.73ms  min=914.8µs med=2.23ms max=58.79ms p(90)=7.45ms   p(95)=42.74ms
       { expected_response:true }...: avg=5.73ms  min=914.8µs med=2.23ms max=58.79ms p(90)=7.45ms   p(95)=42.74ms
     http_req_failed................: 0.00%   ✓ 0          ✗ 2385
     http_req_receiving.............: avg=66.37µs min=9.5µs   med=47.3µs max=1.12ms  p(90)=133.47µs p(95)=173.63µs
     http_req_sending...............: avg=26.26µs min=4.2µs   med=14µs   max=515.7µs p(90)=50.87µs  p(95)=85.77µs
     http_req_tls_handshaking.......: avg=0s      min=0s      med=0s     max=0s      p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=5.64ms  min=857.4µs med=2.16ms max=58.56ms p(90)=7.27ms   p(95)=42.67ms
     http_reqs......................: 2385    149.021958/s
     iteration_duration.............: avg=1s      min=1s      med=1s     max=1.06s   p(90)=1s       p(95)=1.04s
     iterations.....................: 2385    149.021958/s
     vus............................: 13      min=13       max=299
     vus_max........................: 300     min=300      max=300


running (16.0s), 000/300 VUs, 2385 complete and 0 interrupted iterations
default ✓ [======================================] 000/300 VUs  15s
```

## Technical Deep dive

### Glossary

- Replicas: Number of instances of a pod that should be running in a cluster
- Cluster: A set of nodes that run containerized applications. A cluster consists of at least one worker node and one master node. The worker node(s) host the pods that are the components of the application workload. The master node(s) manage the worker nodes and the pods in the cluster.
- VU (load testing): Virtual User. A VU is a simulated user that sends requests to the tested system.

When you visit the URL provided by `minikube service <service-name> --url` or any Kubernetes Service URL, you're not connecting directly to a pod. Instead, you're connecting to a Service, and the Service routes your request to one of the available pods. The selection of a pod is not random but is based on the kube-proxy mode and the type of Service.

Here's a simplified overview of what happens:

### 1. Service Types:

ClusterIP (default):

- Visibility: Internal within the Kubernetes cluster.
- Routing: Directs traffic to the appropriate pod based on the selector.

NodePort:

- Visibility: Exposes the service on the same port of each selected Node in the cluster.
- Routing: Routes incoming traffic on the NodePort to the appropriate pod.

LoadBalancer:

- Visibility: Exposes the Service externally using a cloud provider’s load balancer.
- Routing: Traffic from the external load balancer is routed to the backend pods.

### 2. Service Routing:

When a Service is created, it's assigned a virtual IP address (ClusterIP). This IP address is shared among all pods selected by the Service's selector, and it's used for internal routing.

### 3. Kube-proxy:

kube-proxy is a network proxy that runs on each node in the cluster. It's responsible for maintaining network rules that allow communication to Pods from network sessions inside or outside the cluster.

### 4. Traffic Routing:

When you try to connect to a Service, kube-proxy handles the network traffic and routes your request to one of the pods that the Service points to. The selection of the pod can be based on round-robin or other algorithms depending on the proxy mode used.

### 5. Pod Selection:

It doesn't randomly pick a pod but uses a specific strategy (like round-robin, random, or IP hash, etc.) to distribute incoming requests among the pods. This ensures load balancing across the pods.

### 6. Session Affinity:

Services can also be configured with session affinity to ensure that all requests from a specific client are passed to the same pod, which can be crucial for stateful applications.

### In Summary:

You connect to a Service, not directly to a Pod.

The Service uses labels to select which pods receive the traffic.

kube-proxy manages the network rules and routes traffic from the Service to the appropriate pod based on the configured or default algorithm.

If you're using Minikube and obtaining a URL via minikube service <service-name> --url, you are essentially accessing the NodePort or LoadBalancer service type, which exposes your application outside of the Kubernetes cluster for development and testing purposes.

## Potential Nexts

- Frontend service
- CI/CD, upload image to docker hub
