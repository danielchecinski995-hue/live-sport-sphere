#!/bin/bash
# ============================================
# Live Sport Sphere — GCP Setup Script
# Uruchom po zainstalowaniu gcloud CLI
# ============================================

set -e

PROJECT_ID="live-sport-sphere"
REGION="europe-west1"
SA_NAME="github-actions"
GITHUB_REPO="danielchecinski995-hue/live-sport-sphere"

echo "=========================================="
echo "  Live Sport Sphere — GCP Setup"
echo "=========================================="

# 1. Ustaw projekt
echo ""
echo "1. Ustawiam projekt: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 2. Wlacz wymagane API
echo ""
echo "2. Wlaczam wymagane API..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  iam.googleapis.com

echo "   API wlaczone!"

# 3. Utworz Service Account dla GitHub Actions
echo ""
echo "3. Tworzę Service Account: $SA_NAME"
gcloud iam service-accounts create $SA_NAME \
  --display-name="GitHub Actions Deploy" \
  --description="Service account for CI/CD deployments" \
  2>/dev/null || echo "   (juz istnieje)"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# 4. Nadaj uprawnienia
echo ""
echo "4. Nadaje uprawnienia..."
for role in \
  roles/run.admin \
  roles/artifactregistry.writer \
  roles/cloudbuild.builds.builder \
  roles/iam.serviceAccountUser \
  roles/storage.admin; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role" \
    --quiet
done
echo "   Uprawnienia nadane!"

# 5. Workload Identity Federation
echo ""
echo "5. Konfiguruję Workload Identity Federation..."

# Utworz pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  2>/dev/null || echo "   Pool juz istnieje"

# Utworz provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  2>/dev/null || echo "   Provider juz istnieje"

# Pobierz WIF provider name
WIF_PROVIDER=$(gcloud iam workload-identity-pools providers describe "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)")

# Pozwol GitHub repo uzywac SA
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${WIF_PROVIDER%/providers/*}/attribute.repository/${GITHUB_REPO}" \
  --quiet

echo ""
echo "=========================================="
echo "  GOTOWE! Dodaj te sekrety do GitHub:"
echo "=========================================="
echo ""
echo "  GCP_PROJECT_ID = $PROJECT_ID"
echo "  WIF_PROVIDER   = $WIF_PROVIDER"
echo "  WIF_SERVICE_ACCOUNT = $SA_EMAIL"
echo ""
echo "  GitHub -> Settings -> Secrets -> Actions"
echo "=========================================="
