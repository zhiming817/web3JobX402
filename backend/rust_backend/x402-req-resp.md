 = Requires x402 payment via X-PAYMENT header
### rust client input
=== Unlock resume endpoint called ===
Resume ID: resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147
Buyer wallet: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
Full request: Json(UnlockRequest { resume_id: "resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147", buyer_wallet: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin" })
📡 Calling check_payment with facilitator: http://127.0.0.1:3002
   Pay to: 42YEZmQvsHoENRD85tNNY3KY5nbqZMwPa4CQ2eDfW4Y5
   Network: SolanaDevnet
   HTTP Request headers: HeaderMap { inner: {"content-type": Value { inner: ["application/json"] }, "accept": Value { inner: ["*/*"] }, "accept-encoding": Value { inner: ["gzip, br, deflate"] }, "host": Value { inner: ["127.0.0.1:4021"] }, "content-length": Value { inner: ["121"] }} }
   HTTP Request method: POST
   HTTP Request path: /api/resumes/unlock
✗ Payment check failed, returning 402 Payment Required
=== Unlock resume endpoint called ===
Resume ID: resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147
Buyer wallet: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
Full request: Json(UnlockRequest { resume_id: "resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147", buyer_wallet: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin" })
📡 Calling check_payment with facilitator: http://127.0.0.1:3002
   Pay to: 42YEZmQvsHoENRD85tNNY3KY5nbqZMwPa4CQ2eDfW4Y5
   Network: SolanaDevnet
   HTTP Request headers: HeaderMap 
   { inner: {"content-type": Value { inner: ["application/json"] }, "accept": Value { inner: ["*/*"] }, "accept-encoding": Value { inner: ["gzip, br, deflate"] },
    "x-payment": Value { inner: ["{\"x402Version\":1,\"scheme\":\"exact\",\"network\":\"solana-devnet\",\
  
    ,\"from\":\"9j8Z38Zu61hD9qrp8GFQkYXNyLE1hg7Gj4WpUZaaKSyx\"}"] }, "content-length": Value { inner: ["121"] }, "host": Value { inner: ["127.0.0.1:4021"] }} }
   HTTP Request method: POST
   HTTP Request path: /api/resumes/unlock
✓ Payment verified, settling...
✓ Payment settled successfully
✓ Resume unlocked successfully


### ts client input

=== Unlock resume endpoint called ===
Resume ID: resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147
Buyer wallet: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
Full request: Json(UnlockRequest { resume_id: "resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147", buyer_wallet: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin" })
📡 Calling check_payment with facilitator: http://127.0.0.1:3002
   Pay to: 42YEZmQvsHoENRD85tNNY3KY5nbqZMwPa4CQ2eDfW4Y5
   Network: SolanaDevnet
   HTTP Request headers: HeaderMap { inner: {"content-type": Value { inner: ["application/json"] }, "content-length": Value { inner: ["121"] }, "accept": Value { inner: ["*/*"] }, "user-agent": Value { inner: ["node"] }, "sec-fetch-mode": Value { inner: ["cors"] }, "connection": Value { inner: ["keep-alive"] }, "accept-language": Value { inner: ["*"] }, "host": Value { inner: ["127.0.0.1:4021"] }, "accept-encoding": Value { inner: ["gzip, deflate"] }} }
   HTTP Request method: POST
   HTTP Request path: /api/resumes/unlock
✗ Payment check failed, returning 402 Payment Required
=== Unlock resume endpoint called ===
Resume ID: resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147
Buyer wallet: 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
Full request: Json(UnlockRequest { resume_id: "resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147", buyer_wallet: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin" })
📡 Calling check_payment with facilitator: http://127.0.0.1:3002
   Pay to: 42YEZmQvsHoENRD85tNNY3KY5nbqZMwPa4CQ2eDfW4Y5
   Network: SolanaDevnet
   HTTP Request headers: HeaderMap { inner: {"host": Value { inner: ["127.0.0.1:4021"] }, "connection": Value { inner: ["keep-alive"] }, "accept-language": Value { inner: ["*"] }, "content-type": Value { inner: ["application/json"] }, "sec-fetch-mode": Value { inner: ["cors"] }, "accept-encoding": Value { inner: ["gzip, deflate"] }, "accept": Value { inner: ["*/*"] }, "access-control-expose-headers": Value { inner: ["X-PAYMENT-RESPONSE"] }, 
      "x-payment": Value { inner: ["eyJzY2hlbWUiOiJleGFjdCIsIm5ldHdvcmsiOiJzb2xhbmEtZGV2bmV0IiwieDQwMlZlcnNpb24iOjEsInBheWxvYWQiOnsidHJhbnNhY3Rpb24iOiJBZ0FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUN3Nndpa1NxZUJ0UzFhaCtFUnN0ZjNlRE5oVm5RS2s0KzQrN3pOWVd4cHl2bkp3NWhzWCtqZ2lxQ1ViWE93WWMxa0NncDloV3NNc3Z3bFY3UGZZeVVPZ0FJQkF3Y3M5L1UxYjdidmRVUG9nM1VKTk5OcmgvN29kaGRuZk9NMC9vNFdMRlBUbm9Hb2JjcG90QTV3ZEVhRmRzZmhJOE11Qm1jVk5QQWtxd3dLcXFFV0VEVnIwSGpyb2Z1YmY4VjN6cFAwSUVaUEJGZjZqVVZLaDJXRVl6ZFgzYzdoQkJ6Y3JzcGRoMzJQVzhWdXljTTJjVlFaWmZSSXl6Y1hrdG9hYkhmOXlLQTNIRHRFTExPUklWZnhPcE05QVRRb0xRTXJYLzdOQWFMYjhiZDVCZ2pmQUM2bkF3WkdiK1VoRnpMLzdLMjZjc09iNTd5TTVidkY5eEpyTEVPYk9rQUFBQUFHM2ZiaDEyV2hrOW5MNFViTzYzbXNITFNGN1Y5Yk41RTZqUFdGZnY4QXFjN0w2akhSeWZ0djRrd1BiVldDWjJSZ3JKZXZJdVZXVmdGQ2x1c0hZMGlHQXdVQUJRSmtHUUFBQlFBSkF3RUFBQUFBQUFBQUJnUURCQUlCQ2d4UXd3QUFBQUFBQUFZQSJ9fQ=="] }, "user-agent": Value { inner: ["node"] }, "content-length": Value { inner: ["121"] }} }
   HTTP Request method: POST
   HTTP Request path: /api/resumes/unlock
✗ Payment check error: Error("expected value", line: 1, column: 1)
  Facilitator URL: http://127.0.0.1:3002
  Error details: expected value at line 1 column 1
  Attempting to ping facilitator...


  #### kora ts客户端
  再对比下这个：=== Unlock resume endpoint called ===
Resume ID: resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147
Buyer wallet: CjisaxtyK4n43PBhCATyydWQU93ruN1KJTRkcEhkGVyR
Full request: Json(UnlockRequest { resume_id: "resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147", buyer_wallet: "CjisaxtyK4n43PBhCATyydWQU93ruN1KJTRkcEhkGVyR" })
📡 Calling check_payment with facilitator: http://127.0.0.1:3002
   Pay to: 42YEZmQvsHoENRD85tNNY3KY5nbqZMwPa4CQ2eDfW4Y5
   Network: SolanaDevnet
   HTTP Request headers: HeaderMap { inner: {"content-type": Value { inner: ["application/json"] }, "accept-language": Value { inner: ["*"] }, "sec-fetch-mode": Value { inner: ["cors"] }, "content-length": Value { inner: ["121"] }, "user-agent": Value { inner: ["node"] }, "accept-encoding": Value { inner: ["gzip, deflate"] }, "host": Value { inner: ["127.0.0.1:4021"] }, "accept": Value { inner: ["*/*"] }, "connection": Value { inner: ["keep-alive"] }} }
   HTTP Request method: POST
   HTTP Request path: /api/resumes/unlock
✗ Payment check failed, returning 402 Payment Required
=== Unlock resume endpoint called ===
Resume ID: resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147
Buyer wallet: CjisaxtyK4n43PBhCATyydWQU93ruN1KJTRkcEhkGVyR
Full request: Json(UnlockRequest { resume_id: "resume-335c9c1a-8dfc-4abe-ae94-22cfdfc59147", buyer_wallet: "CjisaxtyK4n43PBhCATyydWQU93ruN1KJTRkcEhkGVyR" })
📡 Calling check_payment with facilitator: http://127.0.0.1:3002
   Pay to: 42YEZmQvsHoENRD85tNNY3KY5nbqZMwPa4CQ2eDfW4Y5
   Network: SolanaDevnet
   HTTP Request headers: HeaderMap { inner: 
   {"x-payment": Value { inner: ["eyJ4NDAyVmVyc2lvbiI6MSwic2NoZW1lIjoiZXhhY3QiLCJuZXR3b3JrIjoic29sYW5hLWRldm5ldCIsImFzc2V0IjoiNHpNTUM5c3J0NVJpNVgxNEdBZ1hoYUhpaTNHblBBRUVSWVBKZ1pKRG5jRFUiLCJwYXlsb2FkIjp7InRyYW5zYWN0aW9uIjoiQWdBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFEQjJTT0dVZC93WXRZcVUrZGFtanUycW5JdDZ4bm16L2NxSnIxWS9ZYlo4VWQ4VDliZkFWcUlLcVdpeGZwRzkremgrdmo1djdpSEpOeHJMOEF5RkpZRWdBSUJBd2NzOS9VMWI3YnZkVVBvZzNVSk5OTnJoLzdvZGhkbmZPTTAvbzRXTEZQVG5xNWlTNURjY2l0Tm9XdjNxRmovSldJaG1PUTZYUG4zYnh4UkhwdCt0UU9BWElyNjJFL2R3S25oaVlidzkwdG43dWNHcDU2VHErMVdqS3E5L1pGN2RGdlFlT3VoKzV0L3hYZk9rL1FnUms4RVYvcU5SVXFIWllSak4xZmR6dUVFSEFNR1JtL2xJUmN5Lyt5dHVuTERtK2U4ak9XN3hmY1NheXhEbXpwQUFBQUFCdDMyNGRkbG9aUFp5K0ZHenV0NXJCeTBoZTFmV3plUk9vejFoWDcvQUtrN1JDeXprU0ZYOFRxVFBRRTBLQzBESzEvK3pRR2kyL0czZVFZSTN3QXVwMHdCTGhmMHpjSUZydU4rREpBSFU1eDdOL1BCN2d5V2pNZm56M3JsbjdyVEF3UUFCUUpRd3dBQUJBQUpBd0VBQUFBQUFBQUFCUVFDQmdNQkNneFF3d0FBQUFBQUFBWUEifX0="] }, "host": Value { inner: ["127.0.0.1:4021"] }, "user-agent": Value { inner: ["node"] }, "content-length": Value { inner: ["121"] }, "connection": Value { inner: ["keep-alive"] }, "content-type": Value { inner: ["application/json"] }, "accept": Value { inner: ["*/*"] }, "accept-language": Value { inner: ["*"] }, "sec-fetch-mode": Value { inner: ["cors"] }, "accept-encoding": Value { inner: ["gzip, deflate"] }} }
   HTTP Request method: POST
   HTTP Request path: /api/resumes/unlock
✗ Payment check error: Error("expected value", line: 1, column: 1)
  Facilitator URL: http://127.0.0.1:3002
  Error details: expected value at line 1 column 1
  Attempting to ping facilitator...