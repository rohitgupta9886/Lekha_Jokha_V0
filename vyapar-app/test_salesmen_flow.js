import http from "http";

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (d) => (buf += d));
        res.on("end", () =>
          resolve({ status: res.statusCode, data: JSON.parse(buf) }),
        );
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:3000${path}`, (res) => {
        let buf = "";
        res.on("data", (d) => (buf += d));
        res.on("end", () =>
          resolve({ status: res.statusCode, data: JSON.parse(buf) }),
        );
      })
      .on("error", reject);
  });
}

async function run() {
  console.log("--- 1. Testing GET /api/v1/salesmen ---");
  const getRes = await get("/api/v1/salesmen?businessId=BIZ-001");
  console.log(
    "GET status:",
    getRes.status,
    "Count:",
    getRes.data.salesmen ? getRes.data.salesmen.length : 0,
  );
  console.log(
    "Salesmen names:",
    (getRes.data.salesmen || []).map((s) => s.name + " (" + s.phone + ")"),
  );

  console.log(
    "\n--- 2. Testing POST /api/v1/salesmen/login (Demo: 9876543210) ---",
  );
  const loginRes = await post("/api/v1/salesmen/login", {
    phone: "9876543210",
  });
  console.log(
    "LOGIN status:",
    loginRes.status,
    "Salesman:",
    loginRes.data.salesman?.name,
    "Biz:",
    loginRes.data.business?.name,
  );

  console.log(
    "\n--- 3. Testing POST /api/v1/salesmen (Create New Salesman) ---",
  );
  const createRes = await post("/api/v1/salesmen", {
    name: "Suresh Raina",
    phone: "9845012345",
    businessId: "BIZ-001",
    role: "Field Executive",
    territory: "Indiranagar",
  });
  console.log(
    "CREATE status:",
    createRes.status,
    "Salesman:",
    createRes.data.salesman?.name,
    "InviteUrl:",
    createRes.data.whatsAppInviteUrl ? "YES" : "NO",
  );

  console.log(
    "\n--- 4. Testing POST /api/v1/salesmen/login with newly created salesman ---",
  );
  const loginNewRes = await post("/api/v1/salesmen/login", {
    phone: "9845012345",
  });
  console.log(
    "LOGIN NEW status:",
    loginNewRes.status,
    "Salesman:",
    loginNewRes.data.salesman?.name,
  );

  console.log("\n--- 5. Testing GET /api/v1/salesmen after create ---");
  const getRes2 = await get("/api/v1/salesmen?businessId=BIZ-001");
  console.log(
    "GET status:",
    getRes2.status,
    "Count:",
    getRes2.data.salesmen ? getRes2.data.salesmen.length : 0,
  );
  console.log(
    "Salesmen list:",
    (getRes2.data.salesmen || []).map((s) => s.name),
  );
}

run().catch(console.error);
