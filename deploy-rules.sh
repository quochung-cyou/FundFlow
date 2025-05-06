#!/bin/bash
# Script to deploy Firestore security rules

echo "Deploying Firestore security rules..."
firebase deploy --only firestore:rules

echo "Rules deployment complete!"
