# React + Vite

## Supabase Auth Setup

1. Create a Supabase project and copy its Project URL and publishable key from **Project Settings > API**.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a local `.env` file. Do not commit `.env`.
3. In **Authentication > URL Configuration**, set the local Site URL to `http://localhost:5173` and add that origin to the redirect URL allow list. Add the production origin before deploying.
4. Enable Google and Kakao in **Authentication > Sign In / Providers**, then add each provider's OAuth client credentials in the Supabase dashboard.
5. Configure each OAuth provider's callback URL to the callback URL shown in its Supabase provider settings.
6. Enable email/password sign-in in Supabase. In **Authentication → URL Configuration**, add the deployed app URL to the redirect allow list, including the repository path for GitHub Pages (for example, `https://<owner>.github.io/saerom/`). Email confirmation and password recovery both use this redirect.
7. For production email delivery, configure a custom SMTP provider in **Authentication → Emails → SMTP Settings**. Supabase's built-in mail provider is intended for testing, limits delivery to project team addresses, and currently allows only two auth emails per hour.

The login dialog offers password recovery. Supabase may return a generic success response to avoid revealing whether an email address has an account; check the Auth logs and SMTP provider delivery logs when a reset email does not arrive.

To allow the operator account to publish administrator-only categories, set that user's `app_metadata.role` to `admin` through a trusted Supabase admin workflow. The server-managed claim is enforced by database policies (RLS).

## Public Admin Answers

Run `supabase/migrations/20261001000000_post_answers.sql` in the Supabase SQL Editor to create the public answer table and RLS policies. Anyone can read answers; only authenticated users with `app_metadata.role = 'admin'` can add or update them. The answer form is shown on `후기` posts.

## Consultation Requests

Run the Supabase migrations in timestamp order, including `20261023030000_check_member_nickname_availability.sql`. The consultation migrations create the consultation request table, private floor-plan bucket, RLS policies, current form fields, separate optional privacy consent, admin-only completion action, consent audit fields, and a database-enforced limit of two floor-plan files per request folder. Visitors can submit a request without signing in; only authenticated users whose server-managed `app_metadata.role` is `admin` can read request details and floor plans. The admin request list is available at `/admin/consultations` and from the admin My Page. Marking a request complete starts a one-year retention period. The final migration provides the signup form's nickname availability lookup and a short-lived database reservation to prevent simultaneous email signups from claiming the same nickname.

Generate a long random secret, use the same value in Supabase and as the GitHub Actions repository secret, then deploy the cleanup Edge Function:

```sh
supabase secrets set CONSULTATION_CLEANUP_SECRET='REPLACE_WITH_LONG_RANDOM_SECRET'
supabase functions deploy cleanup-consultations --no-verify-jwt
```

Add `CONSULTATION_CLEANUP_SECRET` under the repository's **Settings → Secrets and variables → Actions**. The `Clean up expired consultations` workflow runs daily and removes expired floor-plan files through the Storage API before deleting their request records. Without this Edge Function, secret, and scheduled workflow, completed consultation data will not be automatically deleted.

Deploy the failed-upload cleanup function so temporary floor-plan files are removed when the request record cannot be saved:

```sh
supabase functions deploy cleanup-failed-consultation-upload --no-verify-jwt
```

The migrations must be applied to the Supabase project before enabling the consultation form. Keep the bucket private and do not grant public `select` access to either the request table or floor-plan storage.

## Community Posts

Run the community-post migrations in timestamp order, through `20261023000000_portfolio_image_locations.sql`. Posts are shared through the `community_posts` table and images through the public `community-post-images` bucket. Each post can include up to 20 JPG, PNG, WEBP, or GIF images, each up to 10 MB. Portfolio posts can store an optional place name for each image. Existing single-image posts are migrated automatically and continue using their original image.

Only admins (`app_metadata.role = 'admin'`) can publish in `Portfolio` and `공지`; signed-in members can publish in `새롬 이야기` and `후기`. These rules are enforced with RLS. The home slider shows only image posts written by admins, and the home page also lists recent `후기` and `공지` posts. Existing browser-local posts are not migrated automatically; repost them after applying this migration if they should appear in the shared boards.

## Admin Account Management

Run `supabase/migrations/20261013030000_admin_management.sql` in the Supabase SQL Editor. Set `APP_SITE_URL` to the app's exact origin (for example, `https://example.com`, with no trailing path) and deploy the function:

```sh
supabase secrets set APP_SITE_URL=https://example.com
supabase functions deploy invite-admin
```

Run these commands from the project directory after `supabase login` and `supabase link --project-ref <your-project-ref>`. The invitation action cannot work until the function is deployed to the same Supabase project configured by `VITE_SUPABASE_URL`. The function uses Supabase's server-provided `SUPABASE_SERVICE_ROLE_KEY`; never add this key to the frontend or commit it. Admins can invite a new email from My Page, or grant administrator access directly to an existing member by email; both receive `app_metadata.role = 'admin'`. Admins can also remove their own admin role from My Page; the database function prevents the last remaining admin from doing so. This keeps the account but removes administrator access.

## Account Withdrawal

Account withdrawal deletes only the signed-in Supabase Auth account. Community posts and their images are retained; the post's `author_id` is set to `null` so the deleted account cannot be identified or manage the post. Administrators must revoke their own admin role before withdrawing.

## Privacy Policy

The public privacy policy is available at `/privacy` and linked in the site footer and consent screens. The current Supabase project region is `Northeast Asia (Seoul)`. Set `VITE_SUPABASE_REGION` to the exact project region in the local environment and GitHub Actions repository variable of the same name. The policy also describes Supabase's disclosed operational processing outside the project region. Review Supabase's current DPA and subprocessor list when they change.

```sh
supabase functions deploy delete-account
```

Apply `supabase/migrations/20261015020000_preserve_posts_on_account_deletion.sql` to the production database before deploying the function. The function uses Supabase's server-provided `SUPABASE_SERVICE_ROLE_KEY`; never add this key to the frontend or commit it.

## GitHub Pages Deployment

The workflow at `.github/workflows/deploy-pages.yml` builds the site and publishes the generated files to the `gh-pages` branch whenever code is pushed to `main`. It supports project-site paths, uses `404.html` for React Router deep links, and expects these repository Actions secrets:

- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable/anon key. Never use a service-role key here.

Push the project to a GitHub repository and add the two secrets under **Settings → Secrets and variables → Actions**. After the first successful workflow run creates the `gh-pages` branch, open **Settings → Pages → Build and deployment** and select **Deploy from a branch**, branch **`gh-pages`**, folder **`/(root)`**. The site URL appears on the Pages settings page; for this repository it follows `https://<owner>.github.io/saerom/`.

After the first deployment, add the Pages URL to Supabase **Authentication → URL Configuration → Site URL and Redirect URLs**. For administrator invitations, update the Supabase `APP_SITE_URL` secret to that same URL and redeploy `invite-admin`. Supabase migrations and Edge Functions are deployed separately from the static site.

Run `npm run dev` after configuring `.env`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
