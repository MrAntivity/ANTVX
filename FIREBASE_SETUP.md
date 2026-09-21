# Activate careers and the team portal

The website stays on GitHub Pages. Firebase provides Google sign-in, Firestore data, and private resume storage. No Firebase project has been created or connected yet. Empty configuration deliberately keeps submissions and portal sign-in disabled.

## 1. Create your Firebase project

1. Sign in at https://console.firebase.google.com/ with the account that will own the infrastructure. Create a project (Analytics is optional), then register a **Web** app.
2. Copy its public `firebaseConfig` values into `js/firebase-config.js`. This web configuration is public by design. Never put a service-account JSON or private key in this repository.
3. Enable **Authentication → Sign-in method → Google** and select your support email. Add `antvx.xyz` (and `www.antvx.xyz` if used) under **Authentication → Settings → Authorized domains**. Add `localhost` only if you need local testing.
4. Create **Cloud Firestore**, using the default database and production mode. Choose your region deliberately; it cannot be changed in place.
5. Set up **Cloud Storage**. Firebase currently requires the Blaze billing plan for Cloud Storage. Review pricing and set budget alerts before enabling billing. Budget alerts do not cap usage.

## 2. Deploy the access rules

From this repository:

```sh
npm ci
npx firebase login
npx firebase deploy --project YOUR_PROJECT_ID --only firestore:rules,firestore:indexes,storage
```

When prompted, grant the Storage service permission to consult Firestore; resume permissions depend on team membership and application state. Never use test-mode rules for real applicant data.

For private browser downloads, apply the included CORS configuration using Google Cloud CLI with the actual bucket name from your Firebase config:

```sh
gcloud storage buckets update gs://YOUR_STORAGE_BUCKET --cors-file=storage.cors.json
```

Production CORS permits only the two studio domains. Add your exact local origin temporarily to a separate CORS file if testing downloads locally. CORS does not grant data access; Firebase rules still apply.

## 3. Bootstrap the initial owner

In **Firestore → Data**, create collection `members` and document ID:

```text
aidenyue2006@gmail.com
```

Add fields:

| Field | Type | Value |
| --- | --- | --- |
| `role` | string | `owner` |
| `name` | string | `Antivity` |
| `updatedAt` | timestamp | Current time |

The Firebase Console is a trusted administrative interface. The public website cannot self-assign owner privileges. Other owners can only be created through a trusted administrative interface; the portal protects existing owners against accidental removal.

## 4. Publish and open roles

Publish the site using the existing GitHub Pages workflow after merging the feature branch. The portal is deliberately absent from public navigation and footers. Team members type `https://antvx.xyz/team` directly; Firebase sign-in and membership rules still control access. `/careers` and `/team` resolve to directory index pages, with a normal trailing-slash redirect.

1. Sign in at `/team/` with **aidenyue2006@gmail.com**.
2. In **Team access**, add teammates’ exact Google account emails. This grants access; it does not send invitation emails. Share the portal address with them yourself.
3. In **Open roles**, choose **Paid** or **Volunteer**, enter compensation or unpaid-arrangement details, commitment, location expectations, and any requirements. Only enable **Accepting applications** when those details are final. All roles start closed; no compensation has been invented.
4. Try an application using a different Google account, including a PDF. Confirm reviewers can download it, add a private note, and update status. Confirm the applicant can see their status but not notes or other applications.

## Access model

- **Applicants:** verified Google login; create one application per discipline, view their own application status, withdraw an active application. Resume optional, PDF MIME type, 5 MB maximum. Answers become immutable after submission.
- **Reviewers:** read all applications and resumes, update application statuses, add private notes, read studio news and update task statuses.
- **Admins:** reviewer access plus publishing openings, creating/deleting tasks and announcements.
- **Owners:** admin access plus granting, changing, and revoking admin/reviewer membership.

Membership is checked in Firestore and Storage rules on every request. Hiding the portal UI is not the security boundary. Reviewer notes are separate private documents. Downloads use authenticated `getBlob` calls, not stored public download URLs. Rendered user content uses text nodes, not HTML injection.

## Operations before collecting real applications

- Set a recruitment retention period and communicate it in the application privacy notice. No automatic expiry is configured. To fulfill a deletion request, delete the applicant's application document **and its notes subcollection**, and their `resumes/UID/ROLE.pdf` file from the Firebase Console. Firestore document deletion does not cascade. Remove abandoned uploads as needed. This version intentionally keeps irreversible personal-data deletion out of the portal.
- Enable Firebase App Check with reCAPTCHA Enterprise, add its public site key to `js/firebase-config.js`, monitor valid traffic, then enforce it for Firestore and Storage. Authentication and rules remain required. One application per account per role limits duplicates; App Check is not a comprehensive rate limiter.
- PDF type/size validation is not malware scanning. Resume downloads should be treated as untrusted documents. No third-party scanning service or outbound email service is included.
- A withdrawn application cannot be resubmitted under the same role automatically; contact the studio for reconsideration. Status changes do not automatically send email, and the portal says so.
- Studio task assignees are email labels, not a notification system. Team emails should match their verified Google email. Access revocation blocks subsequent server reads, writes, and downloads; it cannot recall data already downloaded.

## Local verification

```sh
npm test
npm run test:rules  # Requires Java 21+; uses demo-antvx only
npm run build
npm run preview
# With the preview running in another terminal:
npm run test:browser
npm run test:e2e  # Requires Java 21+ and Playwright Chromium
```

The emulator suite checks privacy boundaries, role permissions, application immutability, resume restrictions, and access revocation. Test-only identities and records never enter a live Firebase project. Browser checks can use a local server at port 8000. End-to-end production sign-in, storage CORS, billing, and App Check enforcement must be checked after project creation.

Official references: [Firebase web setup](https://firebase.google.com/docs/web/setup), [Storage billing changes](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [Firestore rules](https://firebase.google.com/docs/firestore/security/get-started), [authenticated Storage downloads and CORS](https://firebase.google.com/docs/storage/web/download-files), [App Check](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).
