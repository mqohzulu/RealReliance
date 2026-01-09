1. Install Node.js v18
Angular 16 requires Node.js 16.14+, and Node v18 (LTS) is recommended for stability.

Step 1: Download Node.js

Visit the official Node.js website: https://nodejs.org

Download Node.js v18 (LTS)

Complete the installation using default settings

Step 2: Verify Installation
Open Command Prompt or PowerShell and run:

``` bash
node -v
npm -v
```
Expected output:

Node version: v18.x.x

npm version: 9.x or later

2. Install Angular CLI (v16)
The Angular CLI is required to run and build the Angular application.

Step 1: Install Angular CLI Globally

```bash
npm install -g @angular/cli@16.2.0
```
Step 2: Verify Angular CLI Version

```bash
ng version
```
Expected output should include:

Angular CLI: 16.2.0

Angular Core: 16.2.0

3. Clone the Project Repository

4. Install Project Dependencies
From the project root directory, run:

```bash
npm install
```
This will install all required dependencies listed in package.json.

Important: Ensure Node v18 is active before running this command.

5. Verify Angular Version in Project
Run the following command inside the project folder:

```bash
ng version
```
Confirm:

@angular/core is 16.2.0

No version mismatch errors are displayed

6. Run the Angular Application
Start the development server using:

```bash
ng serve
```
Or, if a custom port is required:

```bash
ng serve --port 4200
```
Once running, open a browser and navigate to:

http://localhost:4200
7. Common Issues & Fixes
Issue: Node Version Mismatch
If you see errors related to unsupported Node versions:

Reinstall Node.js v18

Restart your terminal

Verify using node -v

Issue: npm Dependency Conflicts
Run:

```bash
npm install --legacy-peer-deps
```
Use this only if dependency resolution errors occur.

Issue: Angular CLI Version Conflict
Uninstall existing CLI and reinstall correct version:

```bash
npm uninstall -g @angular/cli
npm install -g @angular/cli@16.2.0
```

8. Why These Versions Were Chosen
Node.js v18 (LTS): Stable, long-term support, compatible with Angular 16

Angular 16.2.0: Required by the project and aligns with modern Angular standards

NB
Do not upgrade Angular or Node versions unless explicitly instructed
