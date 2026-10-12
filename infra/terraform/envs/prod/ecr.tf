module "ecr" {
  source          = "../../modules/ecr"
  repository_name = "lunote/api"
}

# 관리자 웹 이미지(정적 SPA + Caddy, tailnet 전용). CI 없음 — 사람이 scripts/admin-web-release.sh로 push한다.
module "ecr_admin_web" {
  source          = "../../modules/ecr"
  repository_name = "lunote/admin-web"
}
