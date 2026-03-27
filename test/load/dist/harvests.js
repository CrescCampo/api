// test/load/scenarios/harvests.ts
import http2 from "k6/http";
import { check, sleep } from "k6";

// test/load/auth.ts
import http from "k6/http";
var BASE_URL = __ENV.BASE_URL ?? "http://localhost:5000";
function getToken(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );
  return res.json("token");
}

// test/load/scenarios/harvests.ts
var BASE_URL2 = __ENV.BASE_URL ?? "http://localhost:5000";
var options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "10s", target: 0 }
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"]
  }
};
function setup() {
  return { token: getToken(__ENV.TEST_EMAIL, __ENV.TEST_PASSWORD) };
}
function harvests_default(data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    "Content-Type": "application/json"
  };
  const listRes = http2.get(`${BASE_URL2}/harvests?page=1&pageSize=10`, {
    headers
  });
  check(listRes, {
    "list harvests - status 200": (r) => r.status === 200,
    "list harvests - has harvests field": (r) => r.json("harvests") !== null
  });
  sleep(1);
}
export {
  harvests_default as default,
  options,
  setup
};
