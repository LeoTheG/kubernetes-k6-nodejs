#!/bin/bash

eval $(minikube docker-env)
npm run build:docker

kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl rollout restart deployment my-nodejs-app-deployment