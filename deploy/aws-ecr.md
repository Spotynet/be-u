# Spotynet ECR setup (Nabbi / be-u)

Images are published with **`./build.sh`** (no GitHub Actions). Multi-project layout:

```text
ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/apps/nabbi/api
ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/apps/nabbi/web
ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/apps/nabbi/mobile
# later: .../apps/jay/api, ...
```

## 1. Create repositories

```bash
REGION=us-east-1
for name in api web mobile; do
  aws ecr create-repository \
    --repository-name "apps/nabbi/${name}" \
    --region "$REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256
done
```

## 2. IAM — builder/dev (ECR **push**)

**Preferred (one command, needs admin AWS creds):**

```bash
# From a principal that can iam:PutRolePolicy on role instanceRole:
AWS_PROFILE=admin ./deploy/apply-ecr-iam.sh
# or:
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... ./deploy/apply-ecr-iam.sh
```

That attaches inline policy `SpotynetEcrPushApps` to `instanceRole` for
`arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/apps/*` (shared Spotynet builder)
and ensures `apps/nabbi/{api,web,mobile}` repos exist.

Manual equivalent — attach to the instance role that runs `./build.sh`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
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
      "Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/apps/*"
    }
  ]
}
```

## 3. IAM — prod (ECR **pull**)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:DescribeImages",
        "ecr:DescribeRepositories"
      ],
      "Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/apps/nabbi/*"
    }
  ]
}
```

Shared Spotynet box that pulls many apps: use `repository/apps/*`.

## 4. Host tools

- Docker + Compose  
- AWS CLI v2 (`aws ecr get-login-password`)  
- `deploy.env` with `AWS_ACCOUNT_ID` (and `AWS_REGION` if not `us-east-1`)

No access keys in `deploy.env` or `backend/.env` for ECR.
