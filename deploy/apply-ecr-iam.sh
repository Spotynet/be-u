#!/usr/bin/env bash
# Attach ECR push (+ repo create) permissions to the shared Spotynet EC2 instance role.
#
# This machine's instanceRole cannot modify IAM by itself. Run with an admin
# principal, e.g.:
#
#   AWS_PROFILE=admin ./deploy/apply-ecr-iam.sh
#   # or:
#   AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... ./deploy/apply-ecr-iam.sh
#
# Optional:
#   ROLE_NAME=instanceRole
#   AWS_ACCOUNT_ID=484907486766
#   AWS_REGION=us-east-1
#   POLICY_NAME=SpotynetEcrPushApps
#   ENSURE_REPOS=1   # also create apps/nabbi/{api,web,mobile} if missing
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=deploy/lib-ecr.sh
source "$ROOT/deploy/lib-ecr.sh"
load_deploy_env "$ROOT"

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
ROLE_NAME="${ROLE_NAME:-instanceRole}"
POLICY_NAME="${POLICY_NAME:-SpotynetEcrPushApps}"
ENSURE_REPOS="${ENSURE_REPOS:-1}"

echo "Caller: $(aws sts get-caller-identity --query Arn --output text)"
echo "Account: ${AWS_ACCOUNT_ID}"
echo "Role:    ${ROLE_NAME}"
echo "Region:  ${AWS_REGION}"

POLICY_DOC="$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrLogin",
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Sid": "EcrPushApps",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeImages",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:CreateRepository"
      ],
      "Resource": "arn:aws:ecr:${AWS_REGION}:${AWS_ACCOUNT_ID}:repository/apps/*"
    }
  ]
}
EOF
)"

echo "Putting inline role policy ${POLICY_NAME} on ${ROLE_NAME}..."
aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "${POLICY_NAME}" \
  --policy-document "${POLICY_DOC}"

if [[ "${ENSURE_REPOS}" == "1" ]]; then
  for name in api web mobile; do
    repo="apps/nabbi/${name}"
    if aws ecr describe-repositories --repository-names "${repo}" --region "${AWS_REGION}" >/dev/null 2>&1; then
      echo "ECR repo exists: ${repo}"
    else
      echo "Creating ECR repo: ${repo}"
      aws ecr create-repository \
        --repository-name "${repo}" \
        --region "${AWS_REGION}" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 >/dev/null
    fi
  done
fi

echo
echo "Done. On the builder EC2, wait ~10s for credentials refresh (or reboot), then:"
echo "  aws ecr get-authorization-token --region ${AWS_REGION} --query 'authorizationData[0].expiresAt' --output text"
echo "  cd ${ROOT} && ./build.sh"
