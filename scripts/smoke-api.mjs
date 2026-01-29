const apiBaseUrl = process.env.API_BASE_URL || "https://localhost:7191/api";

async function request(name, method, path, body = null, token = null) {
  const url = `${apiBaseUrl}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const ok = res.ok ? "OK" : "FAIL";
    console.log(`[${ok}] ${name} -> ${res.status}`);
    return { status: res.status, ok: res.ok, text };
  } catch (err) {
    console.log(`[FAIL] ${name} -> no response`);
    return { status: 0, ok: false, text: String(err) };
  }
}

async function main() {
  console.log(`API base: ${apiBaseUrl}`);

  await request("Swagger", "GET", "/swagger/v1/swagger.json");
  await request("Contact Test Email", "GET", "/Contact/test-email");
  await request("Contact Submit", "POST", "/Contact/submit", {
    name: "Api Smoke Test",
    email: "smoke@test.local",
    subject: "Frontend script check",
    message: "Testing contact endpoint from smoke-api.mjs",
  });

  const email = "bob.builder@example.com";
  const password = "pass1";

  const login = await request("Auth Login", "POST", "/Authentication/login", {
    Email: email,
    Password: password,
  });

  let token = null;
  try {
    const json = JSON.parse(login.text || "{}");
    token = json.token || null;
  } catch {
    token = null;
  }

  if (!token) {
    console.log("[WARN] No auth token returned; skipping protected endpoints.");
    return;
  }

  await request("Persons List", "GET", "/Persons/GetPersons?activeOnly=true", null, token);
  await request("Accounts List", "GET", "/Accounts/GetAccounts?activeOnly=true", null, token);
  await request("Transactions List", "GET", "/Transaction/GetTransactions?activeOnly=false", null, token);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
