# CI/CD Internal Distribution Setup

## Genel Bakış

GitHub Actions, GitLab CI veya diğer CI/CD sistemlerinde otomatik olarak Internal Distribution build'leri oluşturabilirsiniz.

**Avantajları:**
- ✅ Her push'ta otomatik build
- ✅ Takım üyeleri URL'den doğrudan kurabiliyor
- ✅ Manual build oluşturmaya gerek yok
- ✅ Slack/Discord'a bildirim gönderebiliyor

---

## GitHub Actions Setup

### 1. EAS_TOKEN Oluştur

```bash
# Terminal'da
eas login

# Token'ı al
eas credentials --non-interactive
```

### 2. GitHub Secrets Ekle

1. GitHub repo'ya git: Settings → Secrets and variables → Actions
2. "New repository secret" butonuna bas
3. Name: `EAS_TOKEN`
4. Value: Token'ı yapıştır
5. "Add secret" butonuna bas

### 3. Workflow Dosyası Oluştur

`.github/workflows/internal-distribution.yml` dosyası oluştur:

```yaml
name: Internal Distribution Build

on:
  push:
    branches: [develop, staging]
  workflow_dispatch:  # Manual trigger

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EAS_TOKEN }}
      
      - name: Build iOS
        run: |
          cd apps/mobile
          eas build --platform ios --profile internal --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
      
      - name: Build Android
        run: |
          cd apps/mobile
          eas build --platform android --profile internal --non-interactive
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
      
      - name: Get build URLs
        id: build-urls
        run: |
          cd apps/mobile
          BUILDS=$(eas build:list --distribution internal --limit 2 --json)
          echo "builds=$BUILDS" >> $GITHUB_OUTPUT
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚀 Internal Distribution Build Complete",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Internal Distribution Build*\n${{ github.event.head_commit.message }}\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Workflow>"
                  }
                }
              ]
            }
```

### 4. Slack Webhook Ekle

1. [Slack App Directory](https://api.slack.com/apps) ziyaret et
2. "Create New App" → "From scratch"
3. App adı: "GitHub Actions"
4. Workspace seç
5. "Incoming Webhooks" → "Add New Webhook to Workspace"
6. Channel seç: #deployments
7. Webhook URL'sini kopyala
8. GitHub Secrets'e ekle: `SLACK_WEBHOOK`

---

## Gelişmiş Workflow: Build & Notify

```yaml
name: Build & Notify

on:
  push:
    branches: [develop]

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      ios-build-id: ${{ steps.ios-build.outputs.build-id }}
      android-build-id: ${{ steps.android-build.outputs.build-id }}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EAS_TOKEN }}
      
      - name: Build iOS
        id: ios-build
        run: |
          cd apps/mobile
          BUILD_ID=$(eas build --platform ios --profile internal --non-interactive --json | jq -r '.builds[0].id')
          echo "build-id=$BUILD_ID" >> $GITHUB_OUTPUT
      
      - name: Build Android
        id: android-build
        run: |
          cd apps/mobile
          BUILD_ID=$(eas build --platform android --profile internal --non-interactive --json | jq -r '.builds[0].id')
          echo "build-id=$BUILD_ID" >> $GITHUB_OUTPUT
  
  notify:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Get build URLs
        id: urls
        run: |
          cd apps/mobile
          BUILDS=$(eas build:list --distribution internal --limit 2 --json)
          echo "builds=$BUILDS" >> $GITHUB_OUTPUT
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.24.0
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Internal Distribution Builds Ready",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "📱 Internal Distribution Builds"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*iOS Build*\n${{ needs.build.outputs.ios-build-id }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Android Build*\n${{ needs.build.outputs.android-build-id }}"
                    }
                  ]
                },
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "<https://expo.dev/accounts/${{ secrets.EXPO_ACCOUNT }}/projects/${{ secrets.EXPO_PROJECT }}/builds|View Builds>"
                  }
                }
              ]
            }
```

---

## GitLab CI Setup

`.gitlab-ci.yml` dosyası oluştur:

```yaml
stages:
  - build
  - notify

variables:
  NODE_VERSION: "18"
  EXPO_CLI_VERSION: "latest"

build:ios:
  stage: build
  image: node:18
  before_script:
    - npm ci
    - npm install -g eas-cli
  script:
    - cd apps/mobile
    - eas build --platform ios --profile internal --non-interactive
  only:
    - develop
    - staging
  artifacts:
    reports:
      dotenv: build.env

build:android:
  stage: build
  image: node:18
  before_script:
    - npm ci
    - npm install -g eas-cli
  script:
    - cd apps/mobile
    - eas build --platform android --profile internal --non-interactive
  only:
    - develop
    - staging

notify:slack:
  stage: notify
  image: curlimages/curl:latest
  script:
    - |
      curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d '{
          "text": "✅ Internal Distribution Builds Ready",
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Internal Distribution Build*\nBranch: '$CI_COMMIT_BRANCH'\nCommit: '$CI_COMMIT_SHORT_SHA'\n<'$CI_PROJECT_URL'/-/pipelines/'$CI_PIPELINE_ID'|View Pipeline>"
              }
            }
          ]
        }'
  only:
    - develop
    - staging
  when: on_success
```

---

## Bitbucket Pipelines Setup

`bitbucket-pipelines.yml` dosyası oluştur:

```yaml
image: node:18

pipelines:
  branches:
    develop:
      - step:
          name: Build Internal Distribution
          script:
            - npm ci
            - cd apps/mobile
            - eas build --platform ios --profile internal --non-interactive
            - eas build --platform android --profile internal --non-interactive
          after-script:
            - |
              curl -X POST $SLACK_WEBHOOK_URL \
                -H 'Content-Type: application/json' \
                -d '{
                  "text": "✅ Internal Distribution Builds Ready",
                  "blocks": [
                    {
                      "type": "section",
                      "text": {
                        "type": "mrkdwn",
                        "text": "*Build Status: SUCCESS*\nCommit: '$BITBUCKET_COMMIT'"
                      }
                    }
                  ]
                }'
```

---

## Environment Variables

### GitHub Actions

```bash
# .github/workflows/internal-distribution.yml'de

env:
  EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
  EXPO_ACCOUNT: ${{ secrets.EXPO_ACCOUNT }}
  EXPO_PROJECT: ${{ secrets.EXPO_PROJECT }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml'de

variables:
  EAS_TOKEN: $EAS_TOKEN
  EXPO_ACCOUNT: $EXPO_ACCOUNT
  EXPO_PROJECT: $EXPO_PROJECT
```

---

## Troubleshooting

### "EAS_TOKEN not found"

**Çözüm:**
```bash
# GitHub Secrets'e ekle
# Settings → Secrets and variables → Actions → New repository secret
# Name: EAS_TOKEN
# Value: Token'ı yapıştır
```

### "Build failed in CI"

**Çözüm:**
```bash
# Logs'u kontrol et
# GitHub Actions: Actions tab → Workflow run → Build step

# Local'de test et
cd apps/mobile
eas build --platform ios --profile internal --non-interactive
```

### "Timeout error"

**Çözüm:**
```yaml
# Timeout'u artır
- name: Build iOS
  timeout-minutes: 60
  run: |
    cd apps/mobile
    eas build --platform ios --profile internal --non-interactive
```

### "Credentials not found"

**Çözüm:**
```bash
# EAS credentials'ı kontrol et
eas credentials

# Credentials'ı sıfırla
eas credentials --platform ios --profile internal
```

---

## Best Practices

### ✅ Yapılması Gerekenler

- ✅ Sensitive data'yı secrets'e koy
- ✅ Build logs'unu sakla
- ✅ Slack/Discord'a bildirim gönder
- ✅ Build başarısızlıklarını takip et
- ✅ Timeout'u yeterince uzun ayarla

### ❌ Yapılmaması Gerekenler

- ❌ Token'ı workflow dosyasına hardcode etme
- ❌ Credentials'ı git'e commit etme
- ❌ Çok sık build oluşturma (API rate limit)
- ❌ Production branch'inde internal build

---

## Hızlı Referans

### GitHub Actions Komutları

```bash
# Workflow'u manuel trigger et
# GitHub repo → Actions → Workflow → Run workflow

# Logs'u kontrol et
# Actions → Workflow run → Build step
```

### EAS CLI Komutları

```bash
# Non-interactive build
eas build --platform ios --profile internal --non-interactive

# Build listesi (JSON)
eas build:list --distribution internal --json

# Build detayları
eas build:list --distribution internal --limit 5
```

### Secrets Yönetimi

```bash
# GitHub
Settings → Secrets and variables → Actions

# GitLab
Settings → CI/CD → Variables

# Bitbucket
Repository settings → Pipelines → Repository variables
```

---

## Kaynaklar

- [Expo GitHub Action](https://github.com/expo/expo-github-action)
- [EAS CLI Non-Interactive Mode](https://docs.expo.dev/build/building-on-ci/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI Documentation](https://docs.gitlab.com/ee/ci/)
- [Slack GitHub Action](https://github.com/slackapi/slack-github-action)

---

**Son Güncelleme:** Nov 22, 2025
