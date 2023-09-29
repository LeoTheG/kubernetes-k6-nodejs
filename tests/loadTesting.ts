import http from "k6/http";
import { check, sleep } from "k6";

// dynamically receive the app url from the environment from minikube
if (!__ENV.MY_APP_URL) {
  throw new Error("Please provide an app url");
}

export const options = {
  thresholds: {
    // Assert that 99% of requests finish within 3000ms.
    http_req_duration: ["p(99) < 3000"]
  },
  stages: [{ duration: "15s", target: 300 }]
};

const randomId = () => Math.floor(Math.random() * 10000000);

// Simulated user behavior
export default function () {
  const id = randomId();
  let res = http.get(__ENV.MY_APP_URL + id);
  // Validate response status
  check(res, {
    "status was 200": (r) => r.status == 200,
    "returned same id": (r) => r.body == id.toString()
  });
  sleep(1);
}

// Test configuration
// easy
// export const options = {
//   thresholds: {
//     // Assert that 99% of requests finish within 3000ms.
//     http_req_duration: ["p(99) < 3000"]
//   },
//   // Ramp the number of virtual users up and down
//   stages: [
//     { duration: "30s", target: 15 },
//     { duration: "1m", target: 15 },
//     { duration: "20s", target: 0 }
//   ]
// };
