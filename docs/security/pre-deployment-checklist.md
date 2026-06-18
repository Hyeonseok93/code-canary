# 배포 전 보안 설정 체크리스트



Web/API 개발보안 Guideline (2022 v3.0.0) 기준 **28개 체크리스트** 점검표입니다.



## 점검 상태 정의



| 상태 | 의미 |

|------|------|

| **준수** | 코드·인프라에 이미 반영됨. 지금 repo 상태로 충족. |

| **배포 전 점검** | 구현·문서는 준비됨. **staging/prod `terraform apply`·Secrets·운영값** 입력은 배포 직전에 수행. **미준수/부분준수 아님.** |

| **N/A** | 해당 서비스 범위 밖 (기능 없음). |



dev HTTP·IP 미적용은 **의도적 예외**(§8). prod/staging go-live 전 §0·§1·§3·§4·§6을 확인하세요.



---



## 가이드 28항목 점검 (2026-06 기준)



| # | 항목 | 상태 | 근거 / 배포 전 할 일 |

|---|------|------|----------------------|

| **1-1** | XSS / CSRF | **준수** | React 이스케이프, CSP(`style-src-attr` 없음), Spring CSRF, JWT HttpOnly, CloudFront CSRF 헤더 전달 |

| **1-2** | Injection | **준수** | JPA·Prepared parameter, Explorer 화이트리스트·`SqlLikeEscaper`, native SQL 사용자 입력 결합 없음 |

| **1-3** | 파라미터·hidden 변조 | **준수** | `denyAll` + admin `ROLE_ADMIN`, `PipelineStagingValidator` 등 서버 재검증 |

| **1-4** | SSRF / File Inclusion | **준수** | 사용자 URL fetch 없음. NVD/OSV 고정 API·로컬 staging만 |

| **1-5** | 오픈 리다이렉트 | **준수** | 서버 redirect 없음. 프론트는 고정 `ROOST_HATCH`만 |

| **1-6** | 입력 크기·무결성 | **준수** | Login `@Size`, Explorer page/search/filter 상한, rate limit |

| **2-1** | 악성 파일 업로드 | **N/A** | 웹 업로드 API 없음 |

| **2-2** | 중요 파일 다운로드 | **준수** | 임의 경로 다운로드 없음. analytics는 DB 조회 API만 |

| **3-1** | 비밀번호 정책 | **준수** + **배포 전 점검** | BCrypt(12), `PasswordPolicyValidator` 존재. **배포 전:** Secrets/DB 초기 admin PW가 정책(12자·복잡도) 충족하는지 확인(§3). MFA·만료·변경 API는 §3 **배포 전 점검** |

| **3-2** | 로그인 횟수 제한 | **준수** | IP + username Redis 잠금, nginx/backend login rate limit |

| **3-3** | 세션 고정 | **준수** | Stateless JWT, 로그인 시 신규 토큰 |

| **3-4** | 관리자·일반 분리 | **준수** + **배포 전 점검** | API/UI 논리 분리, ALB→frontend 단일 진입(§0). **배포 전:** §0 **A**(IP CIDR), prod **B**(WAF IP, 권장) |

| **3-5** | 검색엔진 노출 | **준수** | `robots.txt` + admin SPA `noindex` meta (`useAdminNoIndex`) |

| **3-6** | 주석·테스트 페이지 | **준수** | prod 빌드 테스트 페이지 없음. actuator `health`만 |

| **4-1** | Cookie / Web Storage | **준수** + **배포 전 점검** | HttpOnly·SameSite=Strict·path=`/api/admin`. **배포 전:** §1 HTTPS 시 `Secure` 자동 |

| **4-2** | 인증·권한 | **준수** | JWT + revoke, admin authority, logout denylist |

| **4-3** | 불충분한 인가 | **준수** | admin 외 `denyAll`. analytics 의도적 public read-only |

| **4-4** | 평문 전송 | **배포 전 점검** | dev HTTP 의도적. **배포 전:** staging/prod §1 `enable_https=true` |

| **4-5** | 일반 계정 권한 오용 | **N/A** | 일반 회원가입 없음, admin만 |

| **5-1** | 소스·중요정보 응답 | **준수** | Generic error, `show-sql=false` |

| **5-2** | 요청/응답 정보 노출 | **준수** | actuator detail 숨김. admin pipeline error는 admin만 |

| **6-1** | 개인정보 암호화 | **N/A** | 개인정보 수집 기능 없음 |

| **6-2** | 개인정보 일괄처리 | **N/A** | 해당 없음 |

| **7-1** | HTTP Method | **준수** | nginx·`HttpMethodRestrictionFilter` TRACE 등 차단. API 실사용 GET/POST |

| **7-2** | 서버 설정 노출 | **준수** + **배포 전 점검** | `server_tokens off`, non-root 컨테이너. **배포 전:** §4 `enable_waf=true`(prod) |

| **7-3** | 취약한 서버 설정 | **준수** | Security headers, 최소 actuator, trusted proxy CIDR |

| **7-4** | 이용자 보안설정 | **준수** + **배포 전 점검** | HSTS·Secure cookie는 HTTPS 시 자동. **배포 전:** §1 |

| **8-1** | 개발자 정의 | **N/A** | — |



### 요약



| 상태 | 개수 |

|------|------|

| **준수** (단독) | 21 |

| **준수 + 배포 전 점검** | 5 |

| **배포 전 점검** (단독) | 1 (4-4) |

| **N/A** | 5 |



**미준수 / 부분준수: 0** — md에 정리된 배포 전 항목은 go-live 체크리스트로 분리.



---



## 0. 관리자 분리 — 배포 시점 로드맵 (A/B/C/D)



가이드 **3-4**, **3-5** 배포 시 작업.



### ECS 트래픽 경로 (중요)



**모든 외부 요청은 ALB → frontend nginx → backend** 로만 들어갑니다. (`/api/*` ALB 직통 규칙 제거, backend는 Cloud Map 내부 DNS만 노출)



| 경로 | nginx IP/rate limit | 비고 |

|------|---------------------|------|

| `/roost` | **적용** | SPA |

| `/api/auth/login`, `/api/admin/*` | **적용** | reverse proxy |

| `/api/analytics/*` | rate limit만 | public read-only |



ALB 뒤에서는 nginx `real_ip`(VPC CIDR)로 실제 클라이언트 IP를 복원합니다.



| 단계 | 뭐 하냐 | 언제 | 필수? |

|------|---------|------|-------|

| **A** | nginx 운영자 IP allowlist (`frontend_operator_cidrs`) | staging/prod apply 전 | **필수** |

| **B** | WAF operator IP rule (A와 동일 CIDR, Terraform) | prod + `enable_waf=true` | **prod 권장** (edge 이중 방어) |

| **C** | admin `noindex` meta | 코드 반영됨 | **준수** (`useAdminNoIndex`) |

| **D** | admin 서브도메인 분리 | 별도 PR | 선택 (미구현) |



### 환경별



| 환경 | A (IP) | B (WAF IP) | HTTPS (§1) |

|------|--------|------------|------------|

| dev | 비움 (제한 없음) | OFF | HTTP OK |

| staging | CIDR 입력 | WAF 켤 때 자동 | HTTPS 권장 |

| prod | CIDR 입력 | WAF 켤 때 **권장** | HTTPS 필수 |



---



### A. nginx IP allowlist (배포 전 — 필수)



코드: `frontend/docker-entrypoint.d/50-operator-allowlist.sh`



1. 사무실/VPN CIDR 확인

2. `terraform.tfvars`:



   ```hcl

   frontend_operator_cidrs = "203.0.113.0/24,198.51.100.10/32"

   ```



3. `terraform apply` (environments `main.tf` → ECS `NGINX_OPERATOR_CIDRS` 자동 전달)



보호 경로: `/roost`, `/roost/hatch`, `/roost/forage`, `/api/auth/login`, `/api/admin/*`



---



### B. WAF operator IP (배포 전 — prod 권장)



§4 `enable_waf = true` + **동일** `frontend_operator_cidrs` → WAF IP set + 경로 차단 규칙(Terraform `modules/waf`).



CloudFront 사용 시 WAF(CLOUDFRONT scope)에도 동일 CIDR 적용.



---



### C. noindex



`frontend/src/hooks/useAdminNoIndex.ts` — Admin 로그인·콘솔 페이지에 `noindex, nofollow` 적용됨.



---



### D. admin 서브도메인 (나중 — 선택)



별도 인프라 PR. 가이드 필수 아님.



---



## 1. HTTPS 및 쿠키 (7-4) — 배포 전



| 항목 | 조치 |

|------|------|

| staging/prod | `enable_https = true`, `enable_cloudfront = true` |

| JWT Secure | HTTPS/CloudFront 시 Terraform 자동 |

| dev | HTTP 허용 (§8) |



---



## 2. 관리자 분리 (3-4)



| 항목 | 상태 |

|------|------|

| 논리 분리 | **준수** (코드) |

| ALB 단일 진입 (frontend nginx) | **준수** (코드) |

| IP / WAF | **배포 전** §0 A·B |



---



## 3. 계정·인증 (3-1, 3-2) — 배포 전 포함



| 항목 | 상태 |

|------|------|

| BCrypt 12, 계정 잠금 | **준수** |

| 초기 admin PW 정책 | **배포 전** Secrets/DB 확인 (`PasswordPolicyValidator` 기준) |

| MFA | **배포 전** prod go-live 전 TOTP 등 도입 계획(미구현) |

| 비밀번호 만료·변경 API | **배포 전** 분기/60일 주기는 운영 정책 또는 추후 API(미구현) |



---



## 4. WAF / Edge — 배포 전



| 항목 | 상태 |

|------|------|

| OWASP WAF + operator IP rule | **준수** (코드) |

| prod `enable_waf` | **배포 전** tfvars |

| CSRF 헤더, CDN 메서드 | **준수** |



---



## 5. 검색엔진 (3-5)



| 항목 | 상태 |

|------|------|

| robots.txt | **준수** |

| noindex (admin SPA) | **준수** (§0 C) |



---



## 6. GitHub Secrets — 배포 전



`AWS_*`, `ECR_REGISTRY` 설정. `AWS_ENDPOINT` 삭제.



---



## 7. 배포 후 검증



```bash

curl -s https://<domain>/robots.txt

curl -sI https://<domain>/ | grep -i content-security-policy

curl -sI https://<domain>/ | grep -i strict-transport-security

# IP allowlist: allowlist 밖 → /roost/hatch 403

curl -sI -X POST https://<domain>/api/auth/login   # allowlist 밖 → 403 (nginx 또는 WAF)

```



---



## 8. dev 의도적 예외



dev: HTTP·IP allowlist OFF (`frontend_operator_cidrs = ""`). staging/prod go-live 전 §0·§1 필수.



---



*마지막 업데이트: ALB 단일 진입, Terraform operator CIDR/WAF 배선, admin noindex 반영.*

