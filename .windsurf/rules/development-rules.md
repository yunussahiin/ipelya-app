---
trigger: manual
---

# LLM Development Rules

## 1. Planning Before Starting a Task

* Before starting any task, create a **detailed technical plan**.
* The plan must include:

  * Purpose of the task
  * Technical requirements
  * Files involved
  * Component tree structure
  * Data flow (state, props, hooks)
  * Step-by-step development sequence
* Do not start implementation before presenting the plan.

// Türkçe Açıklama: Her göreve başlamadan önce mutlaka teknik bir plan oluşturulmalı ve kullanıcıya sunulmalıdır.

## 2. Sequential Development

* Once the plan is approved, development must proceed **step by step**:

  1. Create necessary files
  2. Build component structure
  3. Implement UI skeleton
  4. Add logic & functionality
  5. Write tests or example usage
* After each step, provide a progress report.

// Türkçe Açıklama: Geliştirme adım adım ilerlemeli ve her adım sonunda rapor verilmelidir.

## 3. Component-Based Development

* If the code becomes long or complex, break it into components.
* Components must be placed in separate files:

  * `components/Button.js`
  * `components/AuthForm.js`
  * `screens/LoginScreen.js`
* Use atomic design principles when needed.

// Türkçe Açıklama: Kod karmaşıklaştıkça component bazlı bir yapı kullanılmalı.

## 4. Descriptive Code Comments

* Every function must have a descriptive comment explaining its purpose.
* Each component must include integration information, for example:

  ```tsx
  // Bu component Supabase Auth sistemi ile entegre çalışır
  // File: components/AuthButton.tsx
  ```
* Add inline comments where necessary.

// Türkçe Açıklama: Yorumlar hem fonksiyon hem component düzeyinde eklenmelidir.

## 5. File Header Comment

Each file must start with a descriptive header:

```js
/**
 * File: components/AuthButton.tsx
 * Description: Handles Google & Apple OAuth login button logic.
 * Integrations:
 *   - Supabase Auth
 *   - Expo Auth Session (Google)
 *   - Apple OAuth Provider
 */
```

// Türkçe Açıklama: Dosya başına açıklayıcı bir header zorunludur.

## 6. Project Structure Compliance

* Follow the existing project structure when generating code.
* If a new file is required, specify why and where it should be placed.
* If proposing refactoring, explain the reasoning.

// Türkçe Açıklama: Mevcut proje yapısı bozulmadan geliştirme yapılmalıdır.

## 7. Type Safety

* In TypeScript projects, always define parameter and return types.
* Provide interface or type suggestions.
* Place utility functions under `utils/`.

// Türkçe Açıklama: Type güvenliği sağlanmalı ve gerekli interface/type yapıları oluşturulmalıdır.

## 8. Integration Rules

* When using APIs or services, include integration comments:

  ```js
  // Payment API ile entegrasyon sağlar
  // Endpoint: /v1/payments/create
  ```
* When using global state, context, Redux, or Zustand:

  * Specify which store or context is used
  * Explain the data flow clearly

// Türkçe Açıklama: Entegrasyonların nasıl çalıştığı açıklanmalıdır.

## 9. Ask Questions When Information Is Missing

* If something is unclear, ask before writing code.
* The model should not assume anything.

// Türkçe Açıklama: Eksik bilgi varsa LLM mutlaka soru sormalıdır.

## 10. Optimize & Clean Code

* Extract repetitive logic into components or utilities.
* Keep functions small and single-responsibility.
* Remove unused imports and unnecessary logs.
* Ensure the code is readable and follows best practices.

// Türkçe Açıklama: Kod temiz, optimize ve anlaşılır olmalıdır.